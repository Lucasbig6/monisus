import { Card } from "@/components/ui/Card";
import { FileText } from "lucide-react";

export default function AnalisesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Análises</h1>
        <p className="text-slate-500 mt-1">Crie análises personalizadas dos dados</p>
      </div>
      <Card className="p-12 text-center">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-slate-900 mb-2">Em desenvolvimento</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Esta área permitirá criar análises personalizadas dos dados de saúde pública.
        </p>
      </Card>
    </div>
  );
}
