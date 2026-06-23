"""
Tests unitaires pour ScriptFactory et les scripts multi-marques.
"""
import pytest
from unittest.mock import patch

from app.application.scripts.script_factory import ScriptFactory
from app.application.scripts.mikrotik import MikroTikScript
from app.application.scripts.tplink import TpLinkScript
from app.application.scripts.huawei import HuaweiScript
from app.application.scripts.ubiquiti import UbiquitiScript
from app.application.scripts.tenda import TendaScript


class TestScriptFactory:
    def test_get_mikrotik(self):
        script = ScriptFactory.get_script("mikrotik")
        assert isinstance(script, MikroTikScript)
        assert script.brand_slug == "mikrotik"

    def test_get_tplink(self):
        script = ScriptFactory.get_script("tp-link")
        assert isinstance(script, TpLinkScript)
        assert script.brand_slug == "tp-link"

    def test_get_huawei(self):
        script = ScriptFactory.get_script("huawei")
        assert isinstance(script, HuaweiScript)
        assert script.brand_slug == "huawei"

    def test_get_ubiquiti(self):
        script = ScriptFactory.get_script("ubiquiti")
        assert isinstance(script, UbiquitiScript)
        assert script.brand_slug == "ubiquiti"

    def test_get_tenda(self):
        script = ScriptFactory.get_script("tenda")
        assert isinstance(script, TendaScript)
        assert script.brand_slug == "tenda"

    def test_unknown_brand_falls_back_to_mikrotik(self):
        script = ScriptFactory.get_script("marque-inconnue")
        assert isinstance(script, MikroTikScript)

    def test_case_insensitive(self):
        script = ScriptFactory.get_script("MiKrOtIk")
        assert isinstance(script, MikroTikScript)

    def test_supported_brands(self):
        brands = ScriptFactory.supported_brands()
        assert "mikrotik" in brands
        assert "tp-link" in brands
        assert "huawei" in brands
        assert "ubiquiti" in brands
        assert "tenda" in brands

    def test_singleton_per_brand(self):
        s1 = ScriptFactory.get_script("mikrotik")
        s2 = ScriptFactory.get_script("mikrotik")
        assert s1 is s2  # même instance

    def test_register_new_brand(self):
        class FakeScript(MikroTikScript):
            @property
            def brand_slug(self):
                return "fake-brand"

        ScriptFactory.register_script("fake-brand", FakeScript)
        script = ScriptFactory.get_script("fake-brand")
        assert isinstance(script, FakeScript)
        assert script.brand_slug == "fake-brand"
        # Cleanup
        ScriptFactory._scripts.pop("fake-brand", None)
        ScriptFactory._instances.pop("fake-brand", None)


class TestScriptOperations:
    """Teste que les scripts ont les bonnes signatures (pas d'appel réseau)."""

    @pytest.mark.asyncio
    async def test_mikrotik_simulation_mode(self):
        """Sans routeros_api, MikroTik tourne en simulation."""
        with patch("app.application.scripts.mikrotik.HAS_ROUTEROS_LIB", False):
            script = MikroTikScript()
            result = await script.create_user(
                router_ip="192.168.88.1", port=8728,
                username="test", password="pass"
            )
            assert result is True  # simulation = succès

    @pytest.mark.asyncio
    async def test_tplink_ping_without_network(self):
        """Sans réseau, TP-Link ping échoue proprement."""
        script = TpLinkScript()
        result = await script.ping(router_ip="192.168.0.1", port=80)
        assert result is False  # pas de réseau = échec
