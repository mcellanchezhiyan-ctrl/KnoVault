import asyncio
from concurrent.futures import ThreadPoolExecutor
from config import settings

executor = ThreadPoolExecutor(max_workers=5)


def _generate_gemini(prompt: str) -> str:
    if not settings.GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY is not set. Please set it in your .env file or configuration. "
            "You can get a free key from Google AI Studio (https://aistudio.google.com/)."
        )
    import google.generativeai as genai
    genai.configure(api_key=settings.GEMINI_API_KEY)
    # Check if a model is set, default to gemini-1.5-flash if gemini-pro is the default (gemini-pro is deprecated/limited)
    model_name = settings.GEMINI_MODEL
    if model_name == "gemini-pro":
        model_name = "gemini-1.5-flash"
    
    model = genai.GenerativeModel(model_name)
    response = model.generate_content(prompt)
    if not response or not response.text:
        raise RuntimeError("Empty response received from Gemini API.")
    return response.text


def _generate_ollama(prompt: str) -> str:
    import ollama
    client = ollama.Client(host=settings.OLLAMA_BASE_URL)
    response = client.generate(model=settings.OLLAMA_MODEL, prompt=prompt)
    if not response or 'response' not in response:
        raise RuntimeError("Empty response received from Ollama.")
    return response['response']


def _generate_openai(prompt: str) -> str:
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not set. Please set it in your .env file.")
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    if not response.choices or not response.choices[0].message.content:
        raise RuntimeError("Empty response received from OpenAI API.")
    return response.choices[0].message.content


def _generate_huggingface(prompt: str) -> str:
    if not settings.HUGGINGFACE_API_KEY:
        raise ValueError(
            "HUGGINGFACE_API_KEY is not set. Please set it in your .env file. "
            "You can get a free key from https://huggingface.co/settings/tokens."
        )
    from huggingface_hub import InferenceClient
    client = InferenceClient(token=settings.HUGGINGFACE_API_KEY)
    response = client.chat_completion(
        model=settings.HUGGINGFACE_MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1024,
        temperature=0.2,
    )
    if not response or not response.choices:
        raise RuntimeError("Empty response received from HuggingFace API.")
    return response.choices[0].message.content


def _generate_sync(prompt: str) -> str:
    provider = settings.LLM_PROVIDER.lower()
    if provider == "gemini":
        return _generate_gemini(prompt)
    elif provider == "ollama":
        return _generate_ollama(prompt)
    elif provider == "openai":
        return _generate_openai(prompt)
    elif provider == "huggingface":
        return _generate_huggingface(prompt)
    else:
        raise ValueError(f"Unsupported LLM provider: {provider}")


async def generate_response(prompt: str) -> str:
    """Asynchronously generates a response from the configured LLM provider."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, _generate_sync, prompt)
