document.addEventListener('DOMContentLoaded', function() {

    if (document.querySelector('select') != null) {
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
        if (window.location.hash = '#offcanvasScrolling') {
            window.location.href = '/';
        }
        if (window.location.href.includes('/favorites#offcanvasScrolling')) {
            window.location.href = '/favorites';
        }
    })

});


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
        if (json.form) {
            document.getElementById('credential-form-fields').innerHTML = json.form;
        }
        else {
            document.getElementById('credential.form-fields').innerHTML = json.error;
        }
    } catch (error) {
        console.error(error.message);
    }
}