"use client";

import { MailIcon, TrashIcon, Upload, XIcon, FileText, CheckCircle, CopyIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { API_ENDPOINTS } from "@/lib/config";

interface SendEmailProps {
    isModalOpen: boolean;
    setIsModalOpen: (value: boolean) => void;
}

interface UploadResult {
    id: string;
    filename: string;
    texto_extraido: string;
    categoria: string;
    resposta_automatica: string;
    resultado_itzam: string;
}



export default function SendEmail({ isModalOpen, setIsModalOpen }: SendEmailProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSendEmail, setIsSendEmail] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [isMessageVisible, setIsMessageVisible] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const maxSize = 20 * 1024 * 1024; // 20MB 
            if (file.size > maxSize) {
                setMessage({ text: 'Arquivo muito grande. O tamanho máximo permitido é 20MB.', type: 'error' });
                return;
            }
            setSelectedFile(file);
            setUploadResult(null); // Limpar resultado anterior
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setUploadResult(null);
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!selectedFile) {
            setMessage({ text: 'Por favor, selecione um arquivo antes de enviar.', type: 'error' });
            return;
        }

        setIsLoading(true);
        setUploadResult(null);
        
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            
            const response = await fetch(API_ENDPOINTS.upload, {
                method: 'POST',
                body: formData,
            });
            
            const data = await response.json();
            
            if (response.ok) {
                setUploadResult(data);
                setMessage({ text: 'Documento processado com sucesso!', type: 'success' });
                setIsMessageVisible(true);
            } else {
                throw new Error(data.error || 'Erro ao processar documento');
            }

            setTimeout(() => {
                setIsMessageVisible(false);
                setTimeout(() => {
                    setMessage(null);
                }, 500);
            }, 2500);

        } catch (error) {
            console.error('Erro ao enviar arquivo:', error);
            setMessage({ text: 'Erro ao processar arquivo. Tente novamente.', type: 'error' });
            setIsMessageVisible(true);
            
            setTimeout(() => {
                setIsMessageVisible(false);
                setTimeout(() => {
                    setMessage(null);
                }, 500);
            }, 2500);
        } finally {
            setTimeout(() => {
                setIsLoading(false);
            }, 1000);
        }
    };

    const copyAnimation = () => {
        setIsMessageVisible(true);
        setTimeout(() => {
            setIsMessageVisible(false);
        }, 2500);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        handleRemoveFile();
        setMessage(null);
        setIsMessageVisible(false);
        setUploadResult(null);
    };



    return (
        <div className={
            cn(
                "flex flex-col items-center transition-all duration-300 justify-center z-20 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2", 
                isModalOpen 
                    ? "opacity-100 pointer-events-auto" 
                    : "opacity-0 pointer-events-none"
            )}>

            <form 
                onSubmit={handleSubmit} 
                className={
                    cn(
                        "flex flex-col min-h-80 w-[600px] transition-all duration-500 justify-between gap-4 bg-gray-100 shadow-md shadow-black/10 p-4 rounded-md",
                        isModalOpen 
                            ? "scale-100"
                            : "scale-50"
                    )
                }
            >
                {!uploadResult && <div className="flex flex-row items-center justify-between gap-10">
                    <h1>Processar Documento</h1>
                    <button 
                        type="button"
                        className="cursor-pointer"
                        onClick={handleCloseModal}
                    >
                        <div className="flex flex-row items-center justify-center hover:bg-gray-200 rounded-full p-0.5 transition-all duration-300">
                            <XIcon className="text-gray-500 w-5 h-5"/>
                        </div>
                    </button>
                </div>}
                
                {!uploadResult ? (
                    <>
                        <div className="flex flex-col items-center justify-center gap-4">
                            <input 
                                type="file" 
                                accept=".pdf,.txt"
                                className="hidden" 
                                id="fileInput"
                                onChange={handleFileChange}
                                disabled={isLoading}
                            />
                            
                            {!selectedFile ? (
                                <label 
                                    htmlFor="fileInput" 
                                    className={cn(
                                        "h-52 w-full p-4 border-2 border-dashed border-gray-300 bg-white rounded-md transition-colors flex flex-col items-center justify-center gap-2",
                                        isLoading 
                                            ? "cursor-not-allowed opacity-50" 
                                            : "cursor-pointer hover:border-gray-400"
                                    )}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-8 h-8 text-gray-400" />
                                        <span className="text-sm text-gray-600">
                                            Clique para selecionar um arquivo
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            Apenas PDF e TXT são aceitos
                                        </span>
                                    </div>
                                </label>
                            ) : (
                                <div className="h-52 w-full p-4 border-2 border-gray-300 bg-white rounded-md flex flex-col items-center justify-center gap-2">
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="w-8 h-8 text-green-500" />
                                        <span className="text-sm text-gray-600 font-medium">
                                            {selectedFile.name}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleRemoveFile}
                                            className="flex flex-row gap-1 items-center justify-center *:text-xs text-red-500 hover:text-red-700 transition-colors hover:cursor-pointer "
                                        >
                                            <TrashIcon className="size-4"/>
                                            <span>Remover arquivo</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <button
                            type="submit"
                            disabled={!selectedFile || isLoading}
                            onClick={() => {setIsSendEmail(true)}}
                            className="overflow-hidden w-full py-2 flex flex-row items-center justify-center gap-2 cursor-pointer bg-green-500 hover:bg-green-500/90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 text-white rounded-md"
                        >
                            <span>{isLoading ? 'Processando...' : 'Processar'}</span>
                            <MailIcon className={cn("w-5 h-5 transition-all duration-300", isSendEmail && "translate-x-[300px]")}/>
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Documento processado com sucesso!</span>
                        </div>
                        
                        <div className="bg-white p-4 rounded-md">
                            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                {uploadResult.filename}
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Texto Extraído</h4>
                                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 max-h-32 overflow-y-auto">
                                        {uploadResult.texto_extraido.substring(0, 200)}...
                                    </div>
                                </div>
                                
                                {uploadResult.categoria && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Classificação</h4>
                                        <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                            uploadResult.categoria === 'Produtivo' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {uploadResult.categoria}
                                        </div>
                                    </div>
                                )}
                                
                                {uploadResult.resposta_automatica && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Resposta Automática</h4>
                                        <div className="mb-2 bg-green-50 p-3 rounded text-sm text-gray-700 border-l-4 border-green-400">
                                            {uploadResult.resposta_automatica}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(uploadResult.resposta_automatica);
                                                setMessage({ text: 'Resposta copiada para área de transferência!', type: 'success' });
                                                copyAnimation();
                                            }}
                                            className="flex flex-row gap-1 items-center w-full justify-end *:text-xs text-green-500 hover:text-green-700 transition-colors hover:cursor-pointer "
                                        >
                                            <CopyIcon className="size-4"/>
                                            <span>Copiar Resposta</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    handleCloseModal();
                                    setIsModalOpen(true);
                                }}
                                className="flex-1 py-2 bg-gray-500 cursor-pointer hover:bg-gray-600 text-white rounded-md transition-colors"
                            >
                                Enviar outro documento
                            </button>
                            <Link href="/uploads" className="w-1/2">
                                <button className="group relative w-full py-2 flex flex-row items-center justify-center gap-2 cursor-pointer bg-[#FE7706] hover:bg-[#FE7706]/90 transition-all duration-300 text-white rounded-md">
                                    <span>Ver Documentos</span>
                                    <Image
                                    src="/folder.png" 
                                    alt="folder" 
                                    width={40} 
                                    height={40}
                                    className="absolute scale-90 -top-3 -right-3 group-hover:animate-shake"
                                    />
                                </button>
                            </Link>
                        </div>
                    </div>
                )}
            </form>

            {/* Mensagem de feedback */}
            <div className={cn(
                "absolute -z-10 bottom-0 p-3 rounded-md text-sm font-medium transition-all duration-500 min-h-[44px] flex items-center",
                message && isMessageVisible
                    ? message.type === 'success' 
                        ? "translate-y-14 bg-green-100 text-green-700 border border-green-200 opacity-100" 
                        : "translate-y-14 bg-red-100 text-red-700 border border-red-200 opacity-100"
                    : "opacity-0 translate-y-0"
            )}>
                {message?.text}
            </div>
        </div>
    );
}