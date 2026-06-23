"""
Factory : fournit le bon script routeur selon la marque.

Usage :
    script = ScriptFactory.get_script(brand_slug)
    success = await script.create_user(...)
"""
import logging
from typing import Dict, Optional, Type

from app.application.scripts.base import RouterScript
from app.application.scripts.mikrotik import MikroTikScript
from app.application.scripts.tplink import TpLinkScript
from app.application.scripts.huawei import HuaweiScript
from app.application.scripts.ubiquiti import UbiquitiScript
from app.application.scripts.tenda import TendaScript

logger = logging.getLogger(__name__)


class ScriptFactory:
    """Fournit le script adapté à chaque marque de routeur."""

    _scripts: Dict[str, Type[RouterScript]] = {
        "mikrotik": MikroTikScript,
        "tp-link": TpLinkScript,
        "huawei": HuaweiScript,
        "ubiquiti": UbiquitiScript,
        "tenda": TendaScript,
    }

    _instances: Dict[str, RouterScript] = {}

    @classmethod
    def get_script(cls, brand_slug: str) -> RouterScript:
        """Retourne l'instance du script pour la marque donnée."""
        slug = brand_slug.lower().strip()

        if slug not in cls._instances:
            script_class = cls._scripts.get(slug)
            if not script_class:
                logger.warning("Marque non supportee : %s — fallback MikroTik", slug)
                script_class = MikroTikScript
            cls._instances[slug] = script_class()

        return cls._instances[slug]

    @classmethod
    def register_script(cls, brand_slug: str, script_class: Type[RouterScript]) -> None:
        """Enregistre un nouveau script (extensibilité)."""
        cls._scripts[brand_slug.lower()] = script_class
        cls._instances.pop(brand_slug.lower(), None)

    @classmethod
    def supported_brands(cls):
        return list(cls._scripts.keys())
