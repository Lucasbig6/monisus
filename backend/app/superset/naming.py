from __future__ import annotations

import re
import unicodedata
import uuid


def slugify_table_name(name: str) -> str:
    """Converte um nome amigável em slug seguro para SQL.

    Exemplos:
        "Atendimentos por município" → "atendimentos_por_municipio"
        "Relatório #1 (2024)"        → "relatorio_1_2024"
    """
    nfkd = unicodedata.normalize("NFKD", name)
    ascii_text = nfkd.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "_", ascii_text.lower()).strip("_")
    return slug


def generate_table_name(name: str) -> str:
    """Gera nome físico seguro para tabela materializada.

    Formato: monisus_ds_{slug}_{uuid6}

    Exemplo:
        "Atendimentos por município" → "monisus_ds_atendimentos_por_municipio_a3f8b2"

    O sufixo UUID4 garante unicidade mesmo para nomes idênticos.
    """
    slug = slugify_table_name(name)
    suffix = uuid.uuid4().hex[:6]
    return f"monisus_ds_{slug}_{suffix}"
