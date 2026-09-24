from __future__ import annotations

import re

from app.superset.naming import generate_table_name, slugify_table_name


class TestSlugifyTableName:
    def test_simple_name(self):
        assert slugify_table_name("Atendimentos por município") == "atendimentos_por_municipio"

    def test_removes_accents(self):
        assert slugify_table_name("Relatório") == "relatorio"

    def test_removes_special_characters(self):
        assert slugify_table_name("Dados #1 (2024)") == "dados_1_2024"

    def test_multiple_spaces(self):
        assert slugify_table_name("Atendimentos  por   município") == "atendimentos_por_municipio"

    def test_leading_trailing_spaces(self):
        assert slugify_table_name("  Atendimentos  ") == "atendimentos"

    def test_empty_string(self):
        assert slugify_table_name("") == ""

    def test_only_special_characters(self):
        assert slugify_table_name("###") == ""

    def test_preserves_numbers(self):
        assert slugify_table_name("Renda 2024") == "renda_2024"

    def test_lowercase(self):
        assert slugify_table_name("ATENDIMENTOS") == "atendimentos"


class TestGenerateTableName:
    def test_prefix(self):
        name = generate_table_name("Atendimentos")
        assert name.startswith("monisus_ds_")

    def test_contains_slug(self):
        name = generate_table_name("Atendimentos por município")
        assert "atendimentos_por_municipio" in name

    def test_has_uuid_suffix(self):
        name = generate_table_name("Teste")
        suffix = name.split("_")[-1]
        assert len(suffix) == 6
        assert re.fullmatch(r"[0-9a-f]{6}", suffix)

    def test_unique_for_same_name(self):
        name1 = generate_table_name("Teste")
        name2 = generate_table_name("Teste")
        assert name1 != name2

    def test_valid_sql_identifier(self):
        name = generate_table_name("Qualquer Nome Aqui!")
        assert re.fullmatch(r"[a-z0-9_]+", name)

    def test_full_format(self):
        name = generate_table_name("Internações por município")
        assert re.fullmatch(
            r"monisus_ds_internacoes_por_municipio_[0-9a-f]{6}", name
        )
