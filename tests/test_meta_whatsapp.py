import os
import sys
import logging
from unittest.mock import patch, MagicMock

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from voice.whatsapp import AlertMessage, send_whatsapp_alert

logging.basicConfig(level=logging.INFO)

def test_simulation_mode():
    """Verify that it falls back to simulation mode correctly."""
    print("\n--- Testing Simulation Mode ---")
    alert = AlertMessage(
        to_number="919876543210",
        event_headline="Strait of Hormuz Blockage",
        risk_level="HIGH",
        recommendation="Stock 20 units of LPG immediately.",
        profit_impact_inr=5000.0
    )
    
    # Ensure env vars are NOT set
    with patch.dict(os.environ, {"WHATSAPP_TOKEN": "", "WHATSAPP_PHONE_NUMBER_ID": ""}):
        # We need to reload the module or just rely on the fact that the variables are checked inside the function
        # In our case, they are checked inside send_whatsapp_alert
        result = send_whatsapp_alert(alert)
        assert result["success"] is True
        assert result["mode"] == "simulation"
        print("✅ Simulation mode success")

def test_meta_api_mock():
    """Verify the Meta API call logic with a mock."""
    print("\n--- Testing Meta API Logic (Mocked) ---")
    alert = AlertMessage(
        to_number="919876543210",
        event_headline="Fuel Price Surge",
        risk_level="MEDIUM",
        recommendation="Adjust logistics routes.",
        profit_impact_inr=1200.0
    )
    
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "messaging_product": "whatsapp",
        "contacts": [{"input": "919876543210", "wa_id": "919876543210"}],
        "messages": [{"id": "wamid.HBgLOTE5ODc2NTQzMjEwFQIAERgSQ0ZCQ0NEMDhDRjA0NDNFM0VFAA=="}]
    }

    with patch("httpx.Client.post", return_value=mock_response):
        with patch.dict(os.environ, {
            "WHATSAPP_TOKEN": "test_token", 
            "WHATSAPP_PHONE_NUMBER_ID": "test_id"
        }):
            # We need to manually update the local module variables if they were loaded at import
            # But since we patched os.environ, we should be good if we force reload or if I modify the code to check env every time.
            # actually, the code I wrote loads them at module level:
            # _META_TOKEN = os.getenv("WHATSAPP_TOKEN", "")
            # So let's patch the module variables instead.
            with patch("voice.whatsapp._META_TOKEN", "test_token"), \
                 patch("voice.whatsapp._PHONE_ID", "test_id"):
                
                result = send_whatsapp_alert(alert)
                assert result["success"] is True
                assert result["mode"] == "live"
                assert result["id"] != ""
                print("✅ Meta API Mock success")

if __name__ == "__main__":
    try:
        test_simulation_mode()
        test_meta_api_mock()
        print("\nAll tests passed! 🚀")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
