package com.hotspotpay.payment.filter;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.*;

/**
 * Filtre pour capturer le corps brut des requetes webhook.
 *
 * Utilise un wrapper buffered pour que le body puisse etre lu:
 * 1. ICI (pour stockage dans request.getAttribute("rawBody"))
 * 2. PAR SPRING (pour deserialisation @RequestBody)
 *
 * Applique a /payments/star/webhook - necessaire pour la verification HMAC Moneroo.
 */
@Slf4j
@Component
@WebFilter("/payments/*/webhook")
public class RawBodyFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        if (request instanceof HttpServletRequest httpRequest) {
            BufferedRequestWrapper wrapper = new BufferedRequestWrapper(httpRequest);
            try {
                String rawBody = wrapper.getReader().lines()
                        .collect(java.util.stream.Collectors.joining("\n"));
                wrapper.setAttribute("rawBody", rawBody);
            } catch (Exception e) {
                log.error("Erreur lecture rawBody webhook", e);
                throw new ServletException("Impossible de lire le corps de la requete", e);
            }
            chain.doFilter(wrapper, response);
        } else {
            chain.doFilter(request, response);
        }
    }

    private static class BufferedRequestWrapper extends HttpServletRequestWrapper {

        private final byte[] cachedBody;

        public BufferedRequestWrapper(HttpServletRequest request) throws IOException {
            super(request);
            InputStream is = request.getInputStream();
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = is.read(buf)) != -1) {
                baos.write(buf, 0, n);
            }
            this.cachedBody = baos.toByteArray();
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream bais = new ByteArrayInputStream(cachedBody);
            return new ServletInputStream() {
                @Override public boolean isFinished() { return bais.available() == 0; }
                @Override public boolean isReady() { return true; }
                @Override public void setReadListener(ReadListener listener) {}
                @Override public int read() { return bais.read(); }
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(
                    new InputStreamReader(getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
        }
    }
}
