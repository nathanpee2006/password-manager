import { favorite } from "./favorites.js";
import { unfavorite } from "./favorites.js";

document.addEventListener('DOMContentLoaded', function () {

    if (document.querySelector('select') !== null) {
        const select = document.querySelector('select');
        select.onchange = () => {
            let type = select.value;

            const form = document.querySelector('form');
            form.setAttribute('action', `/add/${type}`)

            const formFields = document.getElementById('form-fields');
            formFields.innerHTML = '';

            getForm(type);
        }
    }


    const tableRows = document.querySelectorAll('.table-row');
    tableRows.forEach((tableRow) => {

        let type = tableRow.dataset.type;
        let uuid = tableRow.dataset.uuid;

        const tableRowData = tableRow.querySelectorAll('td:not(:first-child)');
        tableRowData.forEach((tableData) => {
            tableData.addEventListener('click', () => {
                getUserCredentials(type, uuid);
                window.location.href = '#offcanvasScrolling';
            })
        })
    })


    document.getElementById('offcanvas-btn-close').addEventListener('click', () => {
        redirectToPrevPage();
    })
});


function redirectToPrevPage() {
    if (window.location.hash = '#offcanvasScrolling') {
        window.location.href = '/';
    }
    if (window.location.href.includes('/favorites#offcanvasScrolling')) {
        window.location.href = '/favorites';
    }
    if (window.location.href.includes('/type/login#offcanvasScrolling')) {
        window.location.href = '/type/login';
    }
    if (window.location.href.includes('/type/card#offcanvasScrolling')) {
        window.location.href = '/type/card';
    }
    if (window.location.href.includes('/type/pin#offcanvasScrolling')) {
        window.location.href = '/type/pin';
    }
    if (window.location.href.includes('/type/secure-note#offcanvasScrolling')) {
        window.location.href = '/type/secure-note';
    }
}


function copyToClipboard(field) {
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-outline-secondary';
    copyBtn.type = 'button';
    copyBtn.innerHTML = '<i class="bi bi-copy"></i>';
    field.insertAdjacentElement('afterend', copyBtn);

    copyBtn.addEventListener('click', () => {
        field.select();
        navigator.clipboard.writeText(field.value);
    })
}


function toggleVisibility(field) {
    const toggleVisibilityBtn = document.createElement('button');
    toggleVisibilityBtn.className = 'btn btn-outline-secondary';
    toggleVisibilityBtn.type = 'button';
    toggleVisibilityBtn.innerHTML = '<i class="bi bi-eye"></i>';

    field.insertAdjacentElement('afterend', toggleVisibilityBtn);

    toggleVisibilityBtn.addEventListener('click', () => {
        if (toggleVisibilityBtn.innerHTML === '<i class="bi bi-eye"></i>') {
            field.type = 'text';
            toggleVisibilityBtn.innerHTML = '<i class="bi bi-eye-slash"></i>';
        } else {
            field.type = 'password';
            toggleVisibilityBtn.innerHTML = '<i class="bi bi-eye"></i>';
        }
    })
}


function passwordStrengthMeter(field) {
    const options = {
        theme: 'default',
        minimumPasswordScore: Enzoic.PASSWORD_STRENGTH.Strong,
        cssSuccessClass: 'enz-success',
        cssFailClass: 'enz-fail'
    };
    Enzoic.applyToInputElement(field, options);
}


async function getForm(type) {
    const params = new URLSearchParams({
        'type': type
    })

    try {
        const response = await fetch(`/get-form?${params}`);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        if (json.form) {
            document.getElementById('form-fields').innerHTML = json.form;

            document.getElementById('form-fields').querySelectorAll('div').forEach((div) => {
                div.className = 'mb-3';
            })
            document.getElementById('form-fields').querySelectorAll('label').forEach((label) => {
                label.className = 'form-label';
            })
            document.getElementById('form-fields').querySelectorAll('input, textarea').forEach((field) => {
                const div = document.createElement('div');
                div.className = 'input-group';
                field.parentNode.insertBefore(div, field);
                div.appendChild(field)
            })

            if (document.getElementById('form-fields').querySelector('input[name=password]')) {
                const passwordField = document.getElementById('form-fields').querySelector('input[name=password]'); 
                passwordField.type = 'password';
                toggleVisibility(passwordField);
                passwordStrengthMeter(passwordField);
            }
            if (document.getElementById('form-fields').querySelector('input[name=number]') && document.getElementById('form-fields').querySelector('input[name=cvv]')) {
                const numberField = document.getElementById('form-fields').querySelector('input[name=number]');
                numberField.type = 'password'; 
                toggleVisibility(numberField);
                const cvvField = document.getElementById('form-fields').querySelector('input[name=cvv]');
                cvvField.type = 'password';
                toggleVisibility(cvvField);
            }
            if (document.getElementById('form-fields').querySelector('input[name=code]')) {
                const codeField = document.getElementById('form-fields').querySelector('input[name=code]');
                codeField.type = 'password';
                toggleVisibility(codeField);
            }
        }
        else {
            document.getElementById('form-fields').innerHTML = json.error;
        }
    } catch (error) {
        console.error(error.message);
    }
}


async function getUserCredentials(type, uuid) {

    console.log(type, uuid);
    const csrftoken = document.getElementById('credential-form').querySelector('input[name=csrfmiddlewaretoken]').value;

    try {
        const response = await fetch('/get-credentials', {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            method: 'POST',
            body: JSON.stringify({
                type: type,
                uuid: uuid
            }),
            mode: 'same-origin'
        })
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }
        const json = await response.json();
        console.log(json);
        if (json.form) {
            document.getElementById('credential-form-fields').innerHTML = json.form;

            document.getElementById('credential-form-fields').querySelectorAll('div').forEach((div) => {
                div.className = 'mb-3';
            })
            document.getElementById('credential-form-fields').querySelectorAll('label').forEach((label) => {
                label.className = 'form-label';
            })
            document.getElementById('credential-form-fields').querySelectorAll('input, textarea').forEach((field) => {
                const div = document.createElement('div');
                div.className = 'input-group';
                field.parentNode.insertBefore(div, field);
                div.appendChild(field)
            })

            document.getElementById('credential-form-fields').querySelectorAll('input, textarea').forEach((field) => {
                field.setAttribute('readonly', true);
            })

            let name = document.querySelector('.offcanvas').querySelector('input[name=name]').value;
            document.querySelector('.offcanvas-title').innerHTML = name;

            const favoriteButton = document.createElement('button');
            favoriteButton.className = 'favorite-btn';
            if (!json.is_favorited) {
                favoriteButton.innerHTML = '<i class="bi bi-star"></i>';
            } else {
                favoriteButton.innerHTML = '<i class="bi bi-star-fill favorite"></i>';
            }
            document.querySelector('.offcanvas-title').insertAdjacentElement("afterend", favoriteButton);
            favoriteButton.addEventListener('click', () => {
                if (favoriteButton.firstChild.className === 'bi bi-star') {
                    favorite(type, uuid);
                    favoriteButton.firstChild.className = 'bi bi-star-fill favorite';
                } else {
                    unfavorite(type, uuid);
                    favoriteButton.firstChild.className = 'bi bi-star';
                }
            })

            if (document.querySelector('.offcanvas').querySelector('input[name=username]')) {
                const usernameField = document.querySelector('.offcanvas').querySelector('input[name=username]');
                copyToClipboard(usernameField);
            }
            if (document.querySelector('.offcanvas').querySelector('input[name=password]')) {
                const passwordField = document.querySelector('.offcanvas').querySelector('input[name=password]'); 
                passwordField.type = 'password';
                toggleVisibility(passwordField);
                copyToClipboard(passwordField);
                passwordStrengthMeter(passwordField);
            }
            if (document.querySelector('.offcanvas').querySelector('input[name=number]') && document.querySelector('.offcanvas').querySelector('input[name=cvv]')) {
                const numberField = document.querySelector('.offcanvas').querySelector('input[name=number]');
                numberField.type = 'password'; 
                toggleVisibility(numberField);
                copyToClipboard(numberField);
                const cvvField = document.querySelector('.offcanvas').querySelector('input[name=cvv]');
                cvvField.type = 'password';
                toggleVisibility(cvvField);
                copyToClipboard(cvvField);
            }
            if (document.querySelector('.offcanvas').querySelector('input[name=code]')) {
                const codeField = document.querySelector('.offcanvas').querySelector('input[name=code]');
                codeField.type = 'password';
                toggleVisibility(codeField);
                copyToClipboard(codeField);
            }

            const editBtn = document.createElement('button'); 
            editBtn.textContent = 'Edit';
            editBtn.className = 'btn btn-primary';
            editBtn.id = 'edit-btn';
            editBtn.type = 'button';
            editBtn.addEventListener('click', () => {
                document.getElementById('credential-form-fields').querySelectorAll('input, textarea').forEach((field) => {
                    field.removeAttribute('readonly');
                })    
            
                document.getElementById('edit-btn').style.display = 'none';
                document.getElementById('delete-btn').style.display = 'none';

                const saveBtn = document.createElement('button');
                saveBtn.textContent = 'Save';
                saveBtn.className = 'btn btn-success';
                saveBtn.id = 'save-btn';
                saveBtn.type = 'submit';

                saveBtn.addEventListener('mouseover', () => {
                    document.getElementById('credential-form').setAttribute('action', `/edit/credential/${type}/${uuid}`)   
                    document.getElementById('credential-form').setAttribute('method', 'POST')
                })
                saveBtn.addEventListener('mouseout', () => {
                    document.getElementById('credential-form').removeAttribute('action')
                    document.getElementById('credential-form').removeAttribute('method')
                })
                
                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.className = 'btn btn-danger';
                cancelBtn.id = 'cancel-btn';
                cancelBtn.type = 'button';
                cancelBtn.addEventListener('click', () => {
                    document.getElementById('credential-form').reset();
                    document.getElementById('save-btn').remove();
                    document.getElementById('cancel-btn').remove();

                    document.getElementById('edit-btn').style.display = 'inline';
                    document.getElementById('delete-btn').style.display = 'inline';

                    document.getElementById('credential-form-fields').querySelectorAll('input, textarea').forEach((field) => {
                        field.setAttribute('readonly', true);
                    })
                })
                document.getElementById('credential-form').append(saveBtn, cancelBtn);
            });
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'btn btn-danger';
            deleteBtn.id = 'delete-btn';
            deleteBtn.type = 'button';
            deleteBtn.addEventListener('click', () => deleteUserCredentials(type, uuid));
            document.getElementById('credential-form').append(editBtn, deleteBtn);
        }
        else {
            document.getElementById('credential-form-fields').innerHTML = json.error;
        }
    } catch (error) {
        console.error(error.message);
    }
}
 

async function deleteUserCredentials(type, uuid) {

    console.log(type, uuid);
    const csrftoken = document.getElementById('credential-form').querySelector('input[name=csrfmiddlewaretoken]').value;

    try {
        const response = await fetch(`/delete/credential/${type}/${uuid}`, {
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            method: 'DELETE',
            mode: 'same-origin'
        });
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json(); 
        console.log(json);

        redirectToPrevPage();

    } catch (error) {
        console.error(error.message);
    }
}