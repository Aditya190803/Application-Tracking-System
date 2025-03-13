# ATS Resume Scanner

This is a Streamlit web application for an Applicant Tracking System (ATS) Resume Scanner. It allows users to upload a PDF resume and a job description, and then provides various analyses based on the uploaded documents.

## Features

- **Upload PDF Resume**: Users can upload their resume in PDF format.
- **Input Job Description**: Users can input the job description in a text area.
- **Tell Me About the Resume**: Provides an evaluation of the candidate's profile against the job description, highlighting strengths and weaknesses.
- **Get Keywords**: Identifies specific skills and keywords necessary for the resume to have maximum impact, provided in JSON format.
- **Percentage Match**: Evaluates the percentage match of the resume with the job description, along with keywords missing and final thoughts.

## Installation

1. Clone the repository:

```
git clone https://github.com/Aditya190803/Application-Tracking-System.git
```

Install the required dependencies:
```
pip install -r requirements.txt
```
Install poppler (if you currently don't have it in your system)
_mac instructions shown, for other systems see: https://pdf2image.readthedocs.io/en/latest/installation.html_

```
brew install poppler
```
Get an API key for Gemini from https://aistudio.google.com/ and store it under `./streamlit/secrets.toml` as shown below
```
GOOGLE_API_KEY = "<PASTE_API_KEY_HERE>"
```
Run the Streamlit app:
```
streamlit run app.py
```

## Usage
Open the Streamlit app in your browser.
Input the job description in the text area provided.
Upload the PDF resume using the "Upload your resume(PDF)..." button.
Click on the desired action buttons to perform various analyses.

## Technologies Used
- Python
- Streamlit
- pdf2image
- Google Gemini
