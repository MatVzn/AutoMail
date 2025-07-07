"use client";

import { useState, useEffect } from "react";
import { FileText, Calendar, Eye, Trash2, CopyIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { API_ENDPOINTS } from "@/lib/config";

interface Upload {
    id: string;
    filename: string;
    texto_extraido: string;
    categoria: string;
    resposta_automatica: string;
    resultado_itzam: string;
    created_at: string;
}

export default function UploadsList() {
    const [uploads, setUploads] = useState<Upload[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ open: boolean, type: 'single' | 'all', id?: string }>({ open: false, type: 'single' });
    const [deleting, setDeleting] = useState(false);
    const [filter, setFilter] = useState<'all' | 'produtivo' | 'improdutivo'>('all');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        fetchUploads();
    }, []);

    const fetchUploads = async () => {
        try {
            const response = await fetch(API_ENDPOINTS.uploads);
            const data = await response.json();
            setUploads(data.uploads || []);
        } catch (error) {
            console.error('Erro ao buscar uploads:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR');
    };

    const truncateText = (text: string, maxLength: number = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const handleViewUpload = (upload: Upload) => {
        setSelectedUpload(upload);
        setShowModal(true);
    };

    const handleDeleteUpload = (id: string) => {
        setConfirmModal({ open: true, type: 'single', id });
    };

    const handleDeleteAll = () => {
        setConfirmModal({ open: true, type: 'all' });
    };

    const confirmDelete = async () => {
        setDeleting(true);
        if (confirmModal.type === 'single' && confirmModal.id) {
            try {
                const response = await fetch(API_ENDPOINTS.uploadById(confirmModal.id), {
                    method: 'DELETE',
                });
                if (response.ok) {
                    setUploads(uploads.filter(upload => upload.id !== confirmModal.id));
                }
            } catch (error) {
                console.error('Erro ao excluir upload:', error);
            }
        } else if (confirmModal.type === 'all') {
            try {
                // Deletar todos
                const deletePromises = uploads.map(upload =>
                    fetch(API_ENDPOINTS.uploadById(upload.id), { method: 'DELETE' })
                );
                await Promise.all(deletePromises);
                setUploads([]);
            } catch (error) {
                console.error('Erro ao excluir todos uploads:', error);
            }
        }
        setDeleting(false);
        setConfirmModal({ open: false, type: 'single' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-6">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Documentos Processados</h1>
                    <p className="text-gray-600">Visualize todos os documentos processados</p>
                </div>
                {uploads.length > 0 && (
                    <button
                        onClick={handleDeleteAll}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-500/90 cursor-pointer text-white rounded-md transition-colors"
                        disabled={deleting}
                    >
                        <Trash2 className="h-4 w-4" />
                        Apagar todos
                    </button>
                )}
            </div>

            {uploads.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            filter === 'all'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
                        }`}
                    >
                        TODOS ({uploads.length})
                    </button>
                    <button
                        onClick={() => setFilter('produtivo')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            filter === 'produtivo'
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
                        }`}
                    >
                        PRODUTIVOS ({uploads.filter(upload => upload.categoria === 'Produtivo').length})
                    </button>
                    <button
                        onClick={() => setFilter('improdutivo')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            filter === 'improdutivo'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
                        }`}
                    >
                        IMPRODUTIVOS ({uploads.filter(upload => upload.categoria === 'Improdutivo').length})
                    </button>
                </div>
            )}

            {uploads.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-5" />
                    <h3 className="text-lg font-medium text-gray-900">Nenhum documento encontrado</h3>
                    <p className="text-gray-500">Faça upload de um documento para começar</p>
                    <Link href="/" className="mt-5 px-4 py-2 bg-[#FE7706] text-white rounded-md hover:bg-[#FE7706]/90 transition-colors">
                        <span>Voltar para a página inicial</span>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {(() => {
                        const filteredUploads = uploads.filter(upload => {
                            if (filter === 'all') return true;
                            if (filter === 'produtivo') return upload.categoria === 'Produtivo';
                            if (filter === 'improdutivo') return upload.categoria === 'Improdutivo';
                            return true;
                        });

                        if (filteredUploads.length === 0 && uploads.length > 0) {
                            return (
                                <div className="text-center py-12">
                                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Nenhum documento encontrado
                                    </h3>
                                    <p className="text-gray-500">
                                        {filter === 'produtivo' 
                                            ? 'Não há documentos produtivos' 
                                            : filter === 'improdutivo' 
                                                ? 'Não há documentos improdutivos' 
                                                : 'Nenhum documento encontrado'}
                                    </p>
                                    <button
                                        onClick={() => setFilter('all')}
                                        className="mt-4 px-4 py-2 bg-[#FE7706] text-white rounded-md hover:bg-[#FE7706]/90 transition-colors"
                                    >
                                        Ver todos os documentos
                                    </button>
                                </div>
                            );
                        }

                        return filteredUploads.map((upload) => (
                        <div key={upload.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                        <FileText className="h-11 w-11 text-green-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-medium text-gray-900 truncate">
                                            {upload.filename}
                                        </h3>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            {formatDate(upload.created_at)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => handleViewUpload(upload)}
                                        className="inline-flex items-center cursor-pointer transition-all duration-300 px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-600/90"
                                    >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Ver
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUpload(upload.id)}
                                        className="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 cursor-pointer transition-all duration-300"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                {upload.categoria ? (
                                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                                        upload.categoria === 'Produtivo' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {upload.categoria}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">Não classificado</p>
                                )}
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Texto Extraído</h4>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                        {truncateText(upload.texto_extraido, 100)}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Resposta Automática</h4>
                                    <p className="text-sm text-gray-600 bg-green-50 p-3 rounded">
                                        {upload.resposta_automatica ? truncateText(upload.resposta_automatica, 100) : 'Não gerada'}
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(upload.resposta_automatica);
                                                setCopiedId(upload.id);
                                                setTimeout(() => {
                                                    setCopiedId(null);
                                                }, 2000);
                                            }}
                                            className="flex flex-row gap-1 items-center w-full justify-end mt-1 *:text-xs text-green-500 hover:text-green-700 transition-colors hover:cursor-pointer "
                                        >
                                            <CopyIcon className="size-4"/>
                                            <span>{copiedId === upload.id ? 'Copiado com sucesso!' : 'Copiar Resposta'}</span>
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ));
                    })()}
                </div>
            )}

            {/* Modal para visualizar upload completo */}
            {showModal && selectedUpload && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900">{selectedUpload.filename}</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                >
                                    <XIcon className="size-6"/>
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">Texto Extraído</h3>
                                    <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                            {selectedUpload.texto_extraido}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-3">Classificação</h3>
                                        <div className="bg-white rounded-lg">
                                            {selectedUpload.categoria ? (
                                                <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                                                    selectedUpload.categoria === 'Produtivo' 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {selectedUpload.categoria}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-400">Não classificado</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-3">Resposta Automática</h3>
                                        <div className="bg-green-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                {selectedUpload.resposta_automatica || 'Não gerada'}
                                            </p>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedUpload.resposta_automatica);
                                                    setCopiedId(selectedUpload.id);
                                                    setTimeout(() => {
                                                        setCopiedId(null);
                                                    }, 2000);
                                                }}
                                                className="flex flex-row gap-1 items-center w-full justify-end mt-1 *:text-xs text-green-500 hover:text-green-700 transition-colors hover:cursor-pointer "
                                            >
                                                <CopyIcon className="size-4"/>
                                                <span>{copiedId === selectedUpload.id ? 'Copiado com sucesso!' : 'Copiar Resposta'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-row items-center gap-1 mt-6 text-sm text-gray-500">
                                <Calendar className="size-4 mr-1"/>
                                Processado em: {formatDate(selectedUpload.created_at)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmação personalizada */}
            {confirmModal.open && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                        <h2 className="text-lg font-bold mb-4 text-gray-900">
                            {confirmModal.type === 'all' ? 'Apagar todos os documentos?' : 'Apagar este documento?'}
                        </h2>
                        <p className="mb-6 text-gray-700">
                            {confirmModal.type === 'all'
                                ? 'Esta ação irá remover todos os documentos processados. Tem certeza que deseja continuar?'
                                : 'Esta ação não pode ser desfeita. Tem certeza que deseja excluir este documento?'}
                        </p>
                        <div className="flex justify-center gap-2 w-full">
                            <button
                                onClick={() => setConfirmModal({ open: false, type: 'single' })}
                                className="px-4 py-2 cursor-pointer rounded w-full bg-gray-200 hover:bg-gray-300 text-gray-800"
                                disabled={deleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 cursor-pointer rounded w-full bg-red-600 hover:bg-red-700 text-white"
                                disabled={deleting}
                            >
                                {deleting ? 'Apagando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 