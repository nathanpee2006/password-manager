import json
import os
from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.password_validation import validate_password
from django.contrib import messages
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.urls import reverse
from itertools import chain

from .models import User, Login, Card, PIN, SecureNote
from .forms import LoginForm, CardForm, PINForm, SecureNoteForm 

from . import utils

@login_required(login_url="/login")
def index(request):
    
    # GET
    user_id = request.user.id

    login = Login.objects.filter(user_id=user_id)
    card = Card.objects.filter(user_id=user_id)
    pin = PIN.objects.filter(user_id=user_id)
    secure_note = SecureNote.objects.filter(user_id=user_id)

    credentials_list = list(chain(login, card, pin, secure_note))

    credentials = sorted(credentials_list, key=lambda credential:credential.modified_at, reverse=True)

    return render(request, "password_manager/index.html", {
        "form": LoginForm(),
        "credentials": credentials 
    })


def login_view(request):

    # POST
    if request.method == "POST":

        # Authenticate the user
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)

            # Retrieve user's salt value
            salt = User.objects.get(username=username).salt 

            # Generate data encryption key
            DEK = utils.generate_data_encryption_key(password, salt) 

            # Encrypt data encryption key using key encryption key  
            KEK = settings.KEY_ENCRYPTION_KEY

            encrypted_DEK = utils.encrypt_data_encryption_key(DEK, KEK)

            # Store in session
            request.session["encrypted_DEK"] = encrypted_DEK

            return HttpResponseRedirect(reverse("index"))

        else:
            messages.error(request, "Invalid credentials.")
            return render(request, "password_manager/login.html")

    # GET
    else:
        return render(request, "password_manager/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("login"))


def register(request):

    # POST
    if request.method == "POST":

        # Ensure that passwords match
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            messages.error(request, "Passwords do not match!")
            return render(request, "password_manager/register.html")

        # Create new user
        username = request.POST["username"]
        email = request.POST["email"]
        try:
            user = User.objects.create_user(username, email, password)
            validate_password(password)
        except IntegrityError:
            messages.error(request, "Username already exists. Please use another username.")
            return render(request, "password_manager/register.html")
        except ValidationError as err:
            user.delete()
            return render(request, "password_manager/register.html", {
                "messages": err.messages
            })

        # Generate random salt
        salt = os.urandom(16)
        user.salt = salt
        user.save()

        # Redirect to login
        return HttpResponseRedirect(reverse("login")) 

    # GET
    else:
        return render(request, "password_manager/register.html")


def get_form(request):
    
    # GET
    type = request.GET.get("type") 

    if type == "login":
        return JsonResponse({
            "form": LoginForm().as_div()
        })
    elif type == "card":
        return JsonResponse({
            "form": CardForm().as_div()
        })
    elif type == "pin":
        return JsonResponse({
            "form": PINForm().as_div()
        })
    elif type == "secure-note": 
        return JsonResponse({
            "form": SecureNoteForm().as_div()
        })
    else:
        return JsonResponse({
            "error": "Invalid form type."
        })


def add(request, type):
    
    # POST
    if request.method == "POST":

        # Decrypt encrypted data encryption key
        encrypted_DEK = request.session.get("encrypted_DEK")
        if encrypted_DEK:
            nonce = encrypted_DEK["nonce"]
            ciphertext = encrypted_DEK["ciphertext"]
            tag = encrypted_DEK["tag"]
            KEK = settings.KEY_ENCRYPTION_KEY
            result = utils.decrypt_data_encryption_key(nonce, ciphertext, tag, KEK)
            DEK = result["plaintext"]
        else:
            messages.error("Error occured. Please login again.")
            HttpResponseRedirect(reverse("login")) 

        # Encrypt sensitive data with data encryption key
        if type == "login":
            form = LoginForm(request.POST)
            if form.is_valid(): 
                login_model = form.save(commit=False)
                login_model.user_id = request.user.id
                encrypted_password = utils.encrypt_data(login_model.password, DEK)
                login_model.password_nonce = encrypted_password["nonce"]
                login_model.password = encrypted_password["ciphertext"]
                login_model.password_tag = encrypted_password["tag"]
                login_model.save()

        elif type == "card":
            form = CardForm(request.POST)
            if form.is_valid(): 
                card_model = form.save(commit=False)
                card_model.user_id = request.user.id
                encrypted_number = utils.encrypt_data(card_model.number, DEK)
                card_model.number_nonce = encrypted_number["nonce"]
                card_model.number = encrypted_number["ciphertext"]
                card_model.number_tag = encrypted_number["tag"]
                encrypted_cvv = utils.encrypt_data(card_model.cvv, DEK)
                card_model.cvv_nonce = encrypted_cvv["nonce"]
                card_model.cvv = encrypted_cvv["ciphertext"]
                card_model.cvv_tag = encrypted_cvv["tag"]
                card_model.save()

        elif type == "pin":
            form = PINForm(request.POST)
            if form.is_valid():
                pin_model = form.save(commit=False)
                pin_model.user_id = request.user.id
                encrypted_code = utils.encrypt_data(pin_model.code, DEK)
                pin_model.code_nonce = encrypted_code["nonce"]
                pin_model.code = encrypted_code["ciphertext"]
                pin_model.code_tag = encrypted_code["tag"]
                pin_model.save()

        elif type == "secure-note":
            form = SecureNoteForm(request.POST)
            if form.is_valid():
                secure_note_model = form.save(commit=False)
                secure_note_model.user_id = request.user.id
                encrypted_notes = utils.encrypt_data(secure_note_model.notes, DEK)
                secure_note_model.notes_nonce = encrypted_notes["nonce"]
                secure_note_model.notes = encrypted_notes["ciphertext"] 
                secure_note_model.notes_tag = encrypted_notes["tag"]
                secure_note_model.save()

        else:
            messages.error(request, "Invalid type. Please select type from the dropdown.")
            return HttpResponseRedirect(reverse("index"))

        return HttpResponseRedirect(reverse("index"))

    else:
        return JsonResponse({"error": "Invalid request method."})


@login_required(login_url="/login")
def get_credentials(request):

    # POST 
    if request.method == "POST":

        # Decrypt encrypted data encryption key
        # encrypted_DEK = request.session.get("encrypted_DEK")
        # if encrypted_DEK:
        #     nonce = encrypted_DEK["nonce"]
        #     ciphertext = encrypted_DEK["ciphertext"]
        #     tag = encrypted_DEK["tag"]
        #     KEK = settings.KEY_ENCRYPTION_KEY
        #     result = utils.decrypt_data_encryption_key(nonce, ciphertext, tag, KEK)
        #     DEK = result["plaintext"]
        # else:
        #     messages.error("Error occured. Please login again.")
        #     HttpResponseRedirect(reverse("login")) 

        # Ensure user is first authenticated 
        data = json.loads(request.body) 
        type = data["type"] 
        uuid = data["uuid"] 
        user_id = request.user.id

        if type == "login":
            instance = Login.objects.get(id=uuid, user_id=user_id)
            return JsonResponse({
                "form": LoginForm(instance=instance).as_div(),
            })
        elif type == "card":
            instance = Card.objects.get(id=uuid, user_id=user_id)
            return JsonResponse({
                "form": CardForm(instance=instance).as_div()
            })
        elif type == "pin":
            instance = PIN.objects.get(id=uuid, user_id=user_id)
            return JsonResponse({
                "form": PINForm(instance=instance).as_div()
            })
        elif type == "secure-note":
            instance = SecureNote.objects.get(id=uuid, user_id=user_id)
            return JsonResponse({
                "form": SecureNoteForm(instance=instance).as_div()
            })
        else:
            return JsonResponse({
                "error": "Invalid form type."
            })

    else:
        return JsonResponse({"error": "Invalid request method."})


@login_required(login_url="/login")
def favorites(request):

    # GET
    return render(request, "password_manager/favorites.html")