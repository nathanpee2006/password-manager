# Generated by Django 5.1.5 on 2025-02-02 22:49

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('password_manager', '0005_rename_code_cvv_pin_code_tag'),
    ]

    operations = [
        migrations.AlterField(
            model_name='card',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='login',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='pin',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
        migrations.AlterField(
            model_name='securenote',
            name='id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
    ]
