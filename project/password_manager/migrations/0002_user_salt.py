# Generated by Django 5.1.5 on 2025-01-19 02:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('password_manager', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='salt',
            field=models.BinaryField(null=True),
        ),
    ]
