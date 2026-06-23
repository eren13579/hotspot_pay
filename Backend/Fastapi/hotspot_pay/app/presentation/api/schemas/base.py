"""Shared base for Pydantic schemas — camelCase alias support for Java interop."""

from pydantic import BaseModel, ConfigDict


def _to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(p.title() for p in parts[1:])


class CamelBase(BaseModel):
    """Accepte les alias camelCase venant du service Java."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=_to_camel)
