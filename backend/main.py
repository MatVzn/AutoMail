from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from utils import extract_text_from_file
from itzam import Itzam
import os
from dotenv import load_dotenv
import sqlite3
import uuid

# Carregar variáveis de ambiente
load_dotenv()

app = FastAPI()

# Configuração do CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend local
        "https://caseautou.vercel.app",  # Vercel (ajuste para seu domínio)
        "https://*.vercel.app",  # Qualquer subdomínio Vercel
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar cliente Itzam
itzam_api_key = os.getenv("ITZAM_API_KEY")
if not itzam_api_key:
    print("⚠️  AVISO: ITZAM_API_KEY não configurada. Funcionalidade de IA será desabilitada.")
    itzam_client = None
else:
    itzam_client = Itzam(api_key=itzam_api_key)

# Função para inicializar o banco de dados
def init_db():
    conn = sqlite3.connect('caseautou.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS uploads (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            texto_extraido TEXT,
            categoria TEXT,
            resposta_automatica TEXT,
            resultado_itzam TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Inicializar banco na startup
init_db()

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename
    content = await file.read()

    texto_extraido = extract_text_from_file(filename, content)
    
    # Processar o texto com Itzam
    resultado_itzam = ""
    categoria = ""
    resposta_automatica = ""
    workflow_slug = "automail"  # Workflow fixo
    
    if itzam_client:
        try:
            response = itzam_client.text.generate(
                workflow_slug=workflow_slug,
                input=texto_extraido,
                stream=False
            )
            
            resultado_itzam = response.text
            print(f"Resposta do Itzam: {resultado_itzam}")  # Debug
            
            # Tentar extrair JSON do markdown ou processar como JSON puro
            try:
                import json
                import re
                
                # Primeiro tenta processar como JSON puro
                try:
                    json_result = json.loads(resultado_itzam)
                    categoria = json_result.get('category', '')
                    resposta_automatica = json_result.get('auto_response', '')
                    resultado_itzam = json.dumps(json_result, indent=2, ensure_ascii=False)
                except json.JSONDecodeError:
                    # Se não for JSON puro, tenta extrair do markdown
                    # Procura por blocos de código JSON no markdown
                    json_pattern = r'```(?:json)?\s*(\{.*?\})\s*```'
                    match = re.search(json_pattern, resultado_itzam, re.DOTALL)
                    
                    if match:
                        json_str = match.group(1)
                        json_result = json.loads(json_str)
                        categoria = json_result.get('category', '')
                        resposta_automatica = json_result.get('auto_response', '')
                        resultado_itzam = json.dumps(json_result, indent=2, ensure_ascii=False)
                    else:
                        # Se não encontrar JSON no markdown, manter como texto
                        pass
                        
            except Exception as e:
                # Se der erro em qualquer etapa, manter como texto
                print(f"Erro ao processar JSON: {e}")
                pass
                
        except Exception as e:
            error_msg = str(e)
            if "404" in error_msg:
                resultado_itzam = f"Erro: Workflow '{workflow_slug}' não encontrado. Verifique se o workflow existe na sua conta do Itzam."
            else:
                resultado_itzam = f"Erro ao processar com Itzam: {error_msg}"
    else:
        resultado_itzam = "Funcionalidade de IA desabilitada - ITZAM_API_KEY não configurada"
        categoria = "Não classificado"
        resposta_automatica = "Resposta automática não disponível"

    # Salvar no banco de dados
    upload_id = str(uuid.uuid4())
    conn = sqlite3.connect('caseautou.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO uploads (id, filename, texto_extraido, categoria, resposta_automatica, resultado_itzam)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (upload_id, filename, texto_extraido, categoria, resposta_automatica, resultado_itzam))
    conn.commit()
    conn.close()

    return JSONResponse(content={
        "id": upload_id,
        "filename": filename,
        "texto_extraido": texto_extraido,
        "categoria": categoria,
        "resposta_automatica": resposta_automatica,
        "resultado_itzam": resultado_itzam
    })

@app.get("/uploads")
async def get_uploads():
    """Busca todos os uploads salvos"""
    try:
        conn = sqlite3.connect('caseautou.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, filename, texto_extraido, categoria, resposta_automatica, resultado_itzam, created_at
            FROM uploads
            ORDER BY created_at DESC
        ''')
        rows = cursor.fetchall()
        conn.close()
        
        uploads = []
        for row in rows:
            uploads.append({
                "id": row[0],
                "filename": row[1],
                "texto_extraido": row[2],
                "categoria": row[3],
                "resposta_automatica": row[4],
                "resultado_itzam": row[5],
                "created_at": row[6]
            })
        
        return JSONResponse(content={"uploads": uploads})
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/uploads/{upload_id}")
async def get_upload(upload_id: str):
    """Busca um upload específico por ID"""
    try:
        conn = sqlite3.connect('caseautou.db')
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, filename, texto_extraido, categoria, resposta_automatica, resultado_itzam, created_at
            FROM uploads
            WHERE id = ?
        ''', (upload_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return JSONResponse(content={
                "id": row[0],
                "filename": row[1],
                "texto_extraido": row[2],
                "categoria": row[3],
                "resposta_automatica": row[4],
                "resultado_itzam": row[5],
                "created_at": row[6]
            })
        else:
            raise HTTPException(status_code=404, detail="Upload não encontrado")
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.delete("/uploads/{upload_id}")
async def delete_upload(upload_id: str):
    """Exclui um upload específico por ID"""
    try:
        conn = sqlite3.connect('caseautou.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM uploads WHERE id = ?', (upload_id,))
        
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="Upload não encontrado")
        
        conn.commit()
        conn.close()
        
        return JSONResponse(content={"message": "Upload excluído com sucesso"})
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
