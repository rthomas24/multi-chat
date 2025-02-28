import logging
from firebase_functions import https_fn
from firebase_admin import initialize_app
from langchain_openai import ChatOpenAI
from typing import Dict
import json

# Initialize Firebase Admin
initialize_app()

# Set up basic logging instead of Google Cloud Logging
logging.basicConfig(level=logging.INFO)

@https_fn.on_request()
def openai_chat(req: https_fn.Request) -> https_fn.Response:
    logging.info("Function openai_chat triggered with method: %s", req.method)
    # Define CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',  # Replace with specific origins for production
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
        'Access-Control-Max-Age': '3600'
    }

    # Handle preflight OPTIONS request
    if req.method == 'OPTIONS':
        logging.info("Received preflight OPTIONS request.")
        return https_fn.Response('', headers=headers, status=204)

    try:
        # Get API key from header
        api_key = req.headers.get('X-API-Key')
        if not api_key:
            logging.error("Missing API key in the request headers.")
            return https_fn.Response(
                json.dumps({'error': 'Missing API key'}),
                headers=headers,
                status=401
            )

        # Parse request body
        request_json: Dict = req.get_json()
        logging.info("Parsed request JSON: %s", request_json)
        if not request_json or 'prompt' not in request_json or 'model' not in request_json:
            logging.error("Missing prompt or model in the request JSON: %s", request_json)
            return https_fn.Response(
                json.dumps({'error': 'Missing prompt or model in request'}),
                headers=headers,
                status=400
            )

        prompt = request_json['prompt']
        model_name = request_json['model']

        try:
            logging.info("Initializing ChatOpenAI with model: %s", model_name)
            chat = ChatOpenAI(
                model_name=model_name,
                temperature=0,
                openai_api_key=str(api_key).strip(),  # Ensure it's a clean string
                streaming=False
            )
        except TypeError as e:
            logging.error("Error initializing ChatOpenAI: %s", str(e))
            if "unexpected keyword argument 'proxies'" in str(e):
                return https_fn.Response(
                    json.dumps({'error': "API key format error: The API key contains unexpected 'proxies' parameter. Please provide a plain API key string."}),
                    headers=headers,
                    status=500
                )
            elif "unexpected keyword argument" in str(e):
                return https_fn.Response(
                    json.dumps({'error': f"API configuration error: {str(e)}. Please check your API key format."}),
                    headers=headers,
                    status=500
                )
            raise  # Re-raise if it's a different TypeError

        # Create messages list
        messages = [
            ("system", "You are a helpful AI assistant."),
            ("human", prompt)
        ]
        logging.info("Sending messages to ChatOpenAI: %s", messages)

        # Get response from OpenAI
        response = chat.invoke(messages)
        logging.info("Received response from ChatOpenAI: %s", response)

        return https_fn.Response(
            json.dumps({
                'content': response.content,
                'model': model_name,
                'usage': response.usage_metadata
            }),
            headers=headers
        )

    except Exception as e:
        logging.exception("Exception occurred in openai_chat function.")
        return https_fn.Response(
            json.dumps({'error': str(e)}),
            headers=headers,
            status=500
        )