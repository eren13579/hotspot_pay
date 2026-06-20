"""
Interface de base pour les scripts routeur.
Chaque marque (MikroTik, TP-Link, Ubiquiti, Huawei, Tenda...)
fournit son implémentation.

Le script est le même pour tous les modèles d'une même marque.
"""
from abc import ABC, abstractmethod
from typing import Optional


class RouterScript(ABC):
    """Un script de gestion hotspot pour une marque de routeur."""

    @abstractmethod
    async def create_user(
        self,
        router_ip: str,
        port: int,
        username: str,
        password: str,
        profile: str = "default",
        time_limit_seconds: int = 0,
        data_limit_bytes: int = 0,
        mac_address: Optional[str] = None,
        router_user: str = "admin",
        router_password: str = "",
    ) -> bool:
        """Crée un utilisateur hotspot sur le routeur."""
        ...

    @abstractmethod
    async def remove_user(
        self,
        router_ip: str,
        port: int,
        username: str,
        router_user: str = "admin",
        router_password: str = "",
    ) -> bool:
        """Supprime un utilisateur hotspot du routeur."""
        ...

    @abstractmethod
    async def kick_user(
        self,
        router_ip: str,
        port: int,
        mac_address: str,
        router_user: str = "admin",
        router_password: str = "",
    ) -> bool:
        """Déconnecte une session active par adresse MAC."""
        ...

    @abstractmethod
    async def ping(self, router_ip: str, port: int,
                    router_user: str = "admin", router_password: str = "") -> bool:
        """Vérifie que le routeur est joignable."""
        ...

    @property
    @abstractmethod
    def brand_slug(self) -> str:
        """Retourne le slug de la marque supportée (ex: 'mikrotik', 'tp-link')."""
        ...
