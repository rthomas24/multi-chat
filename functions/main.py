import logging
from firebase_functions import https_fn
from firebase_admin import initialize_app
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
# from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from typing import Dict, Any, Optional
import json

# Initialize Firebase Admin
initialize_app()

# Set up basic logging instead of Google Cloud Logging
logging.basicConfig(level=logging.INFO)

def get_chat_model(provider: str, model_name: str, api_key: str) -> Optional[Any]:
    """
    Factory function to create the appropriate chat model based on provider.
    
    Args:
        provider: The provider name (e.g., "OpenAI", "Anthropic")
        model_name: The model name to use
        api_key: The API key for the provider
        
    Returns:
        An initialized chat model instance or None if provider not supported
    """
    api_key = str(api_key).strip()
    
    try:
        if provider == "OpenAI":
            return ChatOpenAI(
                model=model_name,
                temperature=0,
                max_tokens=1024,
                api_key=api_key,
                streaming=False
            )
        elif provider == "Anthropic":
            return ChatAnthropic(
                model=model_name,
                temperature=0,
                max_tokens=1024,
                api_key=api_key,
                timeout=None,
                max_retries=2
            )
        # elif provider == "Google":
        #     return ChatGoogleGenerativeAI(
        #         model=model_name,
        #         temperature=0,
        #         max_output_tokens=1024,
        #         api_key=api_key
        #     )
        # elif provider == "xAI":
        #     # Placeholder - xAI doesn't have a direct LangChain integration yet
        #     return ChatOllama(
        #         model=model_name,
        #         temperature=0
        #     )
        else:
            logging.error(f"Unsupported provider: {provider}")
            return None
    
    except Exception as e:
        logging.error(f"Error initializing {provider} chat model: {str(e)}")
        return None

@https_fn.on_request()
def invoke_chat_models(req: https_fn.Request) -> https_fn.Response:
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
        if not request_json or 'prompt' not in request_json or 'model' not in request_json or 'provider' not in request_json:
            logging.error("Missing required fields in the request JSON: %s", request_json)
            return https_fn.Response(
                json.dumps({'error': 'Missing prompt, model, or provider in request'}),
                headers=headers,
                status=400
            )

        prompt = request_json['prompt']
        model_name = request_json['model']
        provider = request_json['provider']

        try:
            logging.info(f"Initializing {provider} chat model: {model_name}")
            
            # Get the appropriate chat model
            chat = get_chat_model(provider, model_name, api_key)
            
            if not chat:
                return https_fn.Response(
                    json.dumps({'error': f"Unsupported provider: {provider}"}),
                    headers=headers,
                    status=400
                )
                
            # Create messages list
            messages = [
                SystemMessage(content="You are a helpful AI assistant."),
                HumanMessage(content=prompt)
            ]
            
            logging.info(f"Sending messages to {provider} chat model")

            # Get response from the model
            response = chat.invoke(messages)
            logging.info(f"Received response from {provider} chat model")

            return https_fn.Response(
                json.dumps({
                    'content': response.content,
                    'model': model_name,
                    'provider': provider,
                    'usage': getattr(response, 'usage', None)
                }),
                headers=headers
            )
            
        except TypeError as e:
            logging.error(f"Error initializing chat model: {str(e)}")
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

    except Exception as e:
        logging.exception("Exception occurred in openai_chat function.")
        return https_fn.Response(
            json.dumps({'error': str(e)}),
            headers=headers,
            status=500
        )