"use client";

import { Card } from "@/components/ui/Card";
import { Search } from "lucide-react";

export default function ExplorarPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Explorar dados</h1>
        <p className="text-slate-500 mt-1">Descubra padrões nos dados de saúde</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar ou descrever uma análise..."
            className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dados</label>
              <select className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-monisus-500">
                <option>Selecionar dataset...</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Medida</label>
              <select className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-monisus-500">
                <option>Selecionar medida...</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Agrupar por</label>
              <select className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-monisus-500">
                <option>Selecionar dimensão...</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8 text-center">
        <p className="text-slate-400 text-sm">
          Selecione um dataset para começar a explorar
        </p>
      </Card>
    </div>
  );
}
