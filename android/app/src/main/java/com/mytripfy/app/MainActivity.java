package com.mytripfy.app;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Google blocks OAuth in WebViews by detecting "; wv" in the user agent.
        // Remove it so Google treats this as a standard Chrome browser session.
        WebSettings settings = getBridge().getWebView().getSettings();
        String ua = settings.getUserAgentString();
        settings.setUserAgentString(ua.replace("; wv", ""));

        // Enable third-party cookies required for OAuth callback flows (Clerk → Google → Clerk).
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(getBridge().getWebView(), true);
    }
}
