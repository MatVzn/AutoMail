from pypdf import PdfReader
import tempfile

def extract_text_from_file(filename: str, content: bytes) -> str:
    if filename.endswith(".txt"):
        return content.decode("utf-8")
    
    elif filename.endswith(".pdf"):
        # Cria um arquivo temporário para leitura pelo PyPDF2
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        reader = PdfReader(tmp_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text()
        return text
    
    else:
        return ""
