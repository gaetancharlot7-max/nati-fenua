# Email Service using Resend
# Nati Fenua - Transactional emails (password reset, notifications)

import os
import logging
from typing import Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Try to import resend
try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    logger.warning("Resend not installed - email service disabled")

# Configuration
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "noreply@natifenua.com")
APP_NAME = "Nati Fenua"
APP_URL = os.environ.get("APP_URL", "https://nati-fenua-frontend.onrender.com")


class EmailService:
    """Service for sending transactional emails via Resend"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or RESEND_API_KEY
        self.enabled = RESEND_AVAILABLE and bool(self.api_key)
        
        if self.enabled:
            resend.api_key = self.api_key
            logger.info("Email service initialized with Resend")
        else:
            logger.warning("Email service disabled - Resend not configured")
    
    async def send_email(self, to: str, subject: str, html: str) -> bool:
        """Send an email"""
        if not self.enabled:
            logger.debug(f"Email disabled - would send to {to}: {subject}")
            return False
        
        try:
            resend.Emails.send({
                "from": f"{APP_NAME} <{FROM_EMAIL}>",
                "to": to,
                "subject": subject,
                "html": html
            })
            
            logger.info(f"Email sent to {to}: {subject}")
            return True
            
        except Exception as e:
            logger.error(f"Email error: {e}")
            return False
    
    async def send_password_reset(self, to: str, reset_token: str, user_name: str = "Utilisateur") -> bool:
        """Send password reset email"""
        reset_url = f"{APP_URL}/reset-password?token={reset_token}"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #FFF5E6; margin: 0; padding: 20px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #FF6B35, #FF1493); padding: 30px; text-align: center; }}
                .header h1 {{ color: white; margin: 0; font-size: 28px; }}
                .content {{ padding: 30px; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #FF6B35, #FF1493); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 20px 0; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🌺 Nati Fenua</h1>
                </div>
                <div class="content">
                    <h2>Ia ora na {user_name} !</h2>
                    <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
                    <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
                    <p style="text-align: center;">
                        <a href="{reset_url}" class="button">Réinitialiser mon mot de passe</a>
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Ce lien expire dans 1 heure.<br>
                        Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                    </p>
                </div>
                <div class="footer">
                    <p>Māuruuru roa - Merci beaucoup</p>
                    <p>© 2024 Nati Fenua - Le réseau social de la Polynésie Française</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(to, "🔐 Réinitialisation de votre mot de passe - Nati Fenua", html)
    
    async def send_welcome_email(self, to: str, user_name: str) -> bool:
        """Send welcome email to new users"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #FFF5E6; margin: 0; padding: 20px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #FF6B35, #FF1493, #00CED1); padding: 30px; text-align: center; }}
                .header h1 {{ color: white; margin: 0; font-size: 28px; }}
                .content {{ padding: 30px; }}
                .feature {{ display: flex; align-items: center; margin: 15px 0; padding: 15px; background: #FFF5E6; border-radius: 12px; }}
                .feature-icon {{ font-size: 24px; margin-right: 15px; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #FF6B35, #FF1493); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🌺 Maeva {user_name} !</h1>
                </div>
                <div class="content">
                    <h2>Bienvenue sur Nati Fenua !</h2>
                    <p>Vous faites maintenant partie de la communauté polynésienne en ligne.</p>
                    
                    <div class="feature">
                        <span class="feature-icon">📰</span>
                        <div>
                            <strong>Fil d'actualité</strong><br>
                            <span style="color: #666;">Suivez l'actualité de la Polynésie</span>
                        </div>
                    </div>
                    
                    <div class="feature">
                        <span class="feature-icon">🗺️</span>
                        <div>
                            <strong>Carte Mana</strong><br>
                            <span style="color: #666;">Webcams et événements en direct</span>
                        </div>
                    </div>
                    
                    <div class="feature">
                        <span class="feature-icon">💬</span>
                        <div>
                            <strong>Messages</strong><br>
                            <span style="color: #666;">Discutez avec la communauté</span>
                        </div>
                    </div>
                    
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="{APP_URL}" class="button">Découvrir Nati Fenua</a>
                    </p>
                </div>
                <div class="footer">
                    <p>Māuruuru roa - Merci beaucoup</p>
                    <p>© 2024 Nati Fenua - Le réseau social de la Polynésie Française 🇵🇫</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(to, "🌺 Maeva sur Nati Fenua !", html)
    
    async def send_mana_alert_notification(self, to: str, alert_title: str, island: str, sender_name: str) -> bool:
        """Send Mana Alert email notification"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #FFF5E6; margin: 0; padding: 20px; }}
                .container {{ max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
                .header {{ background: linear-gradient(135deg, #FF6B35, #FF8C42); padding: 20px; text-align: center; }}
                .header h1 {{ color: white; margin: 0; font-size: 22px; }}
                .content {{ padding: 30px; text-align: center; }}
                .alert-box {{ background: #FFF5E6; border-left: 4px solid #FF6B35; padding: 20px; margin: 20px 0; text-align: left; border-radius: 8px; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #FF6B35, #FF1493); color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🔔 Alerte Mana - {island}</h1>
                </div>
                <div class="content">
                    <div class="alert-box">
                        <strong>{alert_title}</strong>
                        <p style="color: #666; margin: 10px 0 0 0;">Par {sender_name}</p>
                    </div>
                    <p>
                        <a href="{APP_URL}/mana" class="button">Voir sur la carte</a>
                    </p>
                </div>
                <div class="footer">
                    <p>Vous recevez cet email car vous êtes sur l'île de {island}</p>
                    <p><a href="{APP_URL}/settings/notifications">Gérer mes notifications</a></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return await self.send_email(to, f"🔔 Alerte Mana {island}: {alert_title}", html)

    async def send_reward_unlocked(self, to: str, user_name: str, tier_title: str, tier_reward: str, referral_count: int) -> bool:
        """Send email when a user unlocks a new referral reward tier."""
        rewards_url = f"{APP_URL}/rewards"
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #1A1A2E; margin: 0; padding: 20px; color: #1A1A2E; }}
                .container {{ max-width: 540px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.25); }}
                .header {{ background: linear-gradient(135deg, #FFD700, #FF1493 50%, #9400D3); padding: 36px 24px; text-align: center; }}
                .gift {{ font-size: 56px; line-height: 1; margin-bottom: 8px; }}
                .header h1 {{ color: white; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; }}
                .header p {{ color: rgba(255,255,255,0.95); margin: 6px 0 0; font-size: 14px; }}
                .content {{ padding: 28px 28px 8px; }}
                .tier-card {{ background: linear-gradient(135deg, #FFF5F0, #FFE5DC); border: 2px solid #FF6B35; border-radius: 16px; padding: 20px; text-align: center; margin: 16px 0 24px; }}
                .tier-title {{ font-size: 20px; font-weight: 800; color: #FF1493; margin: 0 0 6px; }}
                .tier-reward {{ font-size: 15px; color: #1A1A2E; margin: 0; }}
                .count {{ display: inline-block; background: #1A1A2E; color: #FFD700; padding: 6px 14px; border-radius: 999px; font-weight: 800; font-size: 13px; }}
                .button {{ display: inline-block; background: linear-gradient(135deg, #FF6B35, #FF1493, #9400D3); color: white !important; padding: 16px 32px; border-radius: 14px; text-decoration: none; font-weight: bold; font-size: 15px; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 11px; border-top: 1px solid #eee; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="gift">🎁</div>
                    <h1>Nouvelle récompense débloquée !</h1>
                    <p>Mauruuru {user_name}, tu fais grandir le Fenua 🌺</p>
                </div>
                <div class="content">
                    <p style="text-align:center;"><span class="count">{referral_count} filleul{'s' if referral_count > 1 else ''} validé{'s' if referral_count > 1 else ''}</span></p>
                    <div class="tier-card">
                        <p class="tier-title">{tier_title}</p>
                        <p class="tier-reward">{tier_reward}</p>
                    </div>
                    <p style="text-align: center; margin: 0 0 28px;">
                        <a href="{rewards_url}" class="button">Voir mes récompenses</a>
                    </p>
                </div>
                <div class="footer">
                    <p>Continue à parrainer pour débloquer plus de cadeaux 🚀</p>
                    <p>© 2026 Nati Fenua — le réseau social de la Polynésie 🇵🇫</p>
                </div>
            </div>
        </body>
        </html>
        """
        return await self.send_email(to, f"🎁 {tier_title} débloqué sur Nati Fenua !", html)


# Global instance
email_service = EmailService()
