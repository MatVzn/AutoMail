"use client";

import Image from "next/image";
import Link from "next/link";
import SendEmail from "@/components/send-email";
import { useState } from "react";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="flex flex-col items-center justify-center relative h-screen">
      <SendEmail isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} />

      <section className="flex flex-col items-center justify-center gap-16 w-[30rem] h-80">

        <div className="flex flex-col items-center justify-center">
          <Image 
            src="/AutoU.png" 
            alt="AutoU-icon" 
            width={100} 
            height={100}
          />
          <h1 className="text-4xl font-bold text-[#FE7706]">AutoU Mail</h1>
        </div>
      
        <div className="flex flex-col items-center justify-center gap-6 w-full">
          <p className="text-lg text-gray-700">
            Selecione uma das opções abaixo para continuar:
          </p>
          <div className="flex flex-row items-center justify-between w-full gap-8">
            <button 
                className="group relative w-1/2 py-2 flex flex-row items-center justify-center gap-2 cursor-pointer bg-[#4D87FF] hover:-translate-y-[2px] shadow-md hover:shadow-lg shadow-black/20 hover:bg-[#FE7706]/90 transition-all duration-300 text-white rounded-md" 
                onClick={() => setIsModalOpen(true)}
            >
              <span>Processar Documento</span>
              <Image 
                  src="/mail.png" 
                  alt="mail" 
                  width={40} 
                  height={40}
                  className="absolute -top-4 -right-3 rotate-12 group-hover:animate-shake"
                />
            </button>
            <Link href="/uploads" className="w-1/2">
              <button className="group relative w-full py-2 flex flex-row items-center justify-center gap-2 cursor-pointer hover:-translate-y-[2px] shadow-md hover:shadow-lg shadow-black/20 bg-[#FE7706] hover:bg-[#FE7706]/90 transition-all duration-300 text-white rounded-md">
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

      </section>
    </main>
  );
}