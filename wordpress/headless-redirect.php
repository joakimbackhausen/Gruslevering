<?php
/**
 * Plugin Name: Headless Frontend Redirect
 * Description: Redirects WooCommerce order-received, cancel-order, and checkout pages
 *              to the headless React frontend. Upload to wp-content/mu-plugins/
 * Version: 1.0
 * Author: Kaervang Materialer
 */

// ── CONFIGURE THIS: Your headless frontend URL (no trailing slash) ──
// Change this to your Railway/production URL
define('HEADLESS_FRONTEND_URL', 'https://shop.gruslevering.dk');

/**
 * Redirect the "Order Received" (thank-you) page to the headless frontend.
 * Triggered after successful payment.
 * WC URL: /checkout/order-received/{order_id}/?key=wc_order_xxx
 */
add_action('template_redirect', function () {
    // Order received / thank you page
    if (is_order_received_page()) {
        $order_id = absint(get_query_var('order-received'));
        if ($order_id) {
            wp_redirect(HEADLESS_FRONTEND_URL . '/ordre-bekraeftelse?order_id=' . $order_id);
            exit;
        }
    }

    // Cart page with cancel_order param (user cancelled payment)
    if (is_cart() && isset($_GET['cancel_order']) && $_GET['cancel_order'] === 'true') {
        $order_id = isset($_GET['order_id']) ? absint($_GET['order_id']) : '';
        $redirect_url = HEADLESS_FRONTEND_URL . '/checkout?cancelled=true';
        if ($order_id) {
            $redirect_url .= '&order_id=' . $order_id;
        }
        wp_redirect($redirect_url);
        exit;
    }

    // WC checkout page (someone navigates directly to it)
    if (is_checkout() && !is_order_received_page()) {
        wp_redirect(HEADLESS_FRONTEND_URL . '/checkout');
        exit;
    }
}, 1);

/**
 * Override the WooCommerce order-received URL to point to headless frontend.
 * This changes where payment gateways redirect after successful payment.
 */
add_filter('woocommerce_get_checkout_order_received_url', function ($url, $order) {
    return HEADLESS_FRONTEND_URL . '/ordre-bekraeftelse?order_id=' . $order->get_id();
}, 99, 2);

/**
 * Override the cancel order URL to point to headless frontend.
 */
add_filter('woocommerce_get_cancel_order_url_raw', function ($url) {
    // Extract order_id from the original URL
    $parsed = parse_url($url);
    parse_str($parsed['query'] ?? '', $params);
    $order_id = $params['order_id'] ?? '';

    $cancel_url = HEADLESS_FRONTEND_URL . '/checkout?cancelled=true';
    if ($order_id) {
        $cancel_url .= '&order_id=' . $order_id;
    }
    return $cancel_url;
}, 99);

/**
 * Override the "Return to shop" URL on the cart page.
 */
add_filter('woocommerce_return_to_shop_redirect', function () {
    return HEADLESS_FRONTEND_URL . '/shop';
});
