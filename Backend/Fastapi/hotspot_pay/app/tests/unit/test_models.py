import pytest
from datetime import datetime, timedelta

from app.domain.models.hotspot import Hotspot, HotspotStatus
from app.domain.models.ticket import Ticket, TicketStatus
from app.domain.models.router_action import RouterAction, RouterActionType, ActionStatus


class TestHotspotModel:
    def test_create_hotspot(self):
        h = Hotspot(user_id="user1", name="Test", mikrotik_ip="192.168.88.1",
                     mikrotik_user="admin", mikrotik_password_enc="enc")
        assert h.user_id == "user1"
        assert h.is_online is False
        assert h.router_token is None

    def test_status_no_token(self):
        h = Hotspot(user_id="user1", name="Test", mikrotik_ip="192.168.88.1",
                     mikrotik_user="admin", mikrotik_password_enc="enc")
        assert h.status == HotspotStatus.NO_TOKEN

    def test_status_never_polled(self):
        h = Hotspot(user_id="user1", name="Test", mikrotik_ip="192.168.88.1",
                     mikrotik_user="admin", mikrotik_password_enc="enc",
                     router_token="abc123")
        assert h.status == HotspotStatus.NEVER_POLLED

    def test_status_online(self):
        h = Hotspot(user_id="user1", name="Test", mikrotik_ip="192.168.88.1",
                     mikrotik_user="admin", mikrotik_password_enc="enc",
                     router_token="abc123", last_ping_at=datetime.utcnow())
        assert h.status == HotspotStatus.ONLINE

    def test_status_offline(self):
        h = Hotspot(user_id="user1", name="Test", mikrotik_ip="192.168.88.1",
                     mikrotik_user="admin", mikrotik_password_enc="enc",
                     router_token="abc123",
                     last_ping_at=datetime.utcnow() - timedelta(seconds=60))
        assert h.status == HotspotStatus.OFFLINE

    def test_mark_online(self):
        h = Hotspot(user_id="user1", name="Test", mikrotik_ip="192.168.88.1",
                     mikrotik_user="admin", mikrotik_password_enc="enc")
        h.mark_online()
        assert h.is_online is True
        assert h.last_ping_at is not None


class TestTicketModel:
    def test_create_ticket(self):
        t = Ticket(hotspot_id="hs1", user_id="user1", username="jez",
                    password="245", profile="1mois-3000",
                    time_limit="4w2d", data_limit=6291456,
                    comment="up-759-05.10.26-")
        assert t.username == "jez"
        assert t.password == "245"
        assert t.profile == "1mois-3000"
        assert t.time_limit == "4w2d"
        assert t.data_limit == 6291456
        assert t.comment == "up-759-05.10.26-"
        assert t.status == TicketStatus.AVAILABLE

    def test_mark_used(self):
        t = Ticket(hotspot_id="hs1", user_id="user1", username="jez", password="245")
        t.mark_used(session_id="sess1", client_mac="AA:BB:CC:DD:EE:FF")
        assert t.status == TicketStatus.USED
        assert t.session_id == "sess1"
        assert t.client_mac == "AA:BB:CC:DD:EE:FF"

    def test_mark_revoked(self):
        t = Ticket(hotspot_id="hs1", user_id="user1", username="jez", password="245")
        t.mark_revoked()
        assert t.status == TicketStatus.REVOKED


class TestRouterActionModel:
    def test_create_action(self):
        a = RouterAction(hotspot_id="hs1", action_type=RouterActionType.CREATE_USER,
                          username="jez", password="245", profile="1mois-3000",
                          time_limit="4w2d", data_limit=6291456,
                          comment="up-759-05.10.26-")
        assert a.action_type == RouterActionType.CREATE_USER
        assert a.username == "jez"
        assert a.status == ActionStatus.PENDING

    def test_mark_delivered(self):
        a = RouterAction(hotspot_id="hs1", action_type=RouterActionType.CREATE_USER,
                          username="jez", password="245")
        a.mark_delivered()
        assert a.status == ActionStatus.DELIVERED
        assert a.delivered_at is not None

    def test_mark_ack_success(self):
        a = RouterAction(hotspot_id="hs1", action_type=RouterActionType.CREATE_USER,
                          username="jez", password="245")
        a.mark_ack(success=True)
        assert a.status == ActionStatus.ACK_SUCCESS
        assert a.ack_success is True

    def test_mark_ack_failed(self):
        a = RouterAction(hotspot_id="hs1", action_type=RouterActionType.CREATE_USER,
                          username="jez", password="245")
        a.mark_ack(success=False, error="create_user_failed")
        assert a.status == ActionStatus.ACK_FAILED
        assert a.ack_error == "create_user_failed"
