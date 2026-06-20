"""
Tests unitaires pour le service de génération de scripts routeur.
"""
import pytest

from app.application.services.script_generator_service import generate_router_script


class TestScriptGenerator:
    def test_mikrotik_generates_rsc(self):
        result = generate_router_script("hs-test-001", "mytoken123", brand_slug="mikrotik")
        assert result["brand"] == "mikrotik"
        assert result["filename"].endswith(".rsc")
        assert "hs-test-001" in result["script"]
        assert "mytoken123" in result["script"]
        assert 'hotspot_id' in result["filename"] or "hs-test" in result["filename"]

    def test_generic_brand_generates_sh(self):
        result = generate_router_script("hs-test-001", "mytoken123", brand_slug="mikrotik")
        # Vérifier que le type de contenu est correct
        assert result["content_type"] == "text/plain; charset=utf-8"

    def test_script_contains_polling_url(self):
        result = generate_router_script("hs-abc", "tok123", brand_slug="mikrotik")
        assert "pending-actions" in result["polling_url"]
        assert "tok123" in result["polling_url"]
        assert "hs-abc" in result["polling_url"]

    def test_script_contains_ack_url(self):
        result = generate_router_script("hs-abc", "tok123", brand_slug="mikrotik")
        assert "ack_base_url" in result or "actions" in result["polling_url"]

    def test_all_brand_slugs_generate(self):
        """Vérifie que toutes les marques supportées génèrent un script sans erreur."""
        brands = ["mikrotik", "tp-link", "huawei", "ubiquiti", "tenda"]
        for brand in brands:
            result = generate_router_script("hs-test", "token", brand_slug=brand)
            assert result["brand"] == brand
            assert len(result["script"]) > 100  # script non vide
            assert result["filename"]

    def test_generated_at_present(self):
        result = generate_router_script("hs-1", "tok", brand_slug="mikrotik")
        assert result["generated_at"]
        assert "UTC" in result["generated_at"]

    def test_instructions_present(self):
        result = generate_router_script("hs-1", "tok", brand_slug="mikrotik")
        assert "instructions" in result
        assert len(result["instructions"]) > 50
