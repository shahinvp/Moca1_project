import os
import re

directory = r"c:\git\front-end\my-react-app\src\assets\components"

for filename in os.listdir(directory):
    if filename.endswith(".jsx"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace template literals
        # `http://127.0.0.1:8000/...` -> `${import.meta.env.VITE_API_URL}/...`
        content = content.replace("`http://127.0.0.1:8000", "`${import.meta.env.VITE_API_URL}")
        
        # Replace normal string quotes
        # "http://127.0.0.1:8000/..." -> import.meta.env.VITE_API_URL + "/..."
        content = content.replace('"http://127.0.0.1:8000', 'import.meta.env.VITE_API_URL + "')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Replaced in {filename}")
