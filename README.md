Steps to test:

1. Extract .zip file
2. cd /your-directory
3. run npm install
4. You do not need Power Automate to be configured. Instead, make this curl call:

curl -Method POST "http://localhost:5000/api/interested" -Headers @{ "Content-Type" = "application/json" } -Body '{ "email": "test@gmail.com", "from_name": "test@gmail.com", "subject": "Interested in your service", "body": "This is an interest submission from the web form." }'

5. Notice an email received entry in the dashboard.


