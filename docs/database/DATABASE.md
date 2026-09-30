# QA Commerce Lab — Database Model

## Overview

The V1 database is based on PostgreSQL.

Main entities:

- users
- addresses
- products
- carts
- cart_items
- coupons
- orders
- order_items
- payments

Test support entities:

- test_personas
- test_addresses

## Relationships

users 1:N addresses

users 1:N carts

carts 1:N cart_items

products 1:N cart_items

users 1:N orders

orders 1:N order_items

products 1:N order_items

orders 1:N payments

coupons 1:N carts

coupons 1:N orders

## Design decisions

### Anonymous carts

Carts may exist without an authenticated user.

Anonymous carts are identified through a unique cart token.

After authentication, the cart can be associated with a user or merged
with an existing user cart.

### Historical snapshots

Orders preserve historical data.

Order items store product name, SKU and price at the time of purchase.

Orders store the delivery address used at checkout.

Changes to products or user addresses must not modify historical orders.

### Payment attempts

A failed payment does not create another order.

One order may contain multiple payment attempts.

The V1 allows a maximum of three payment attempts per order.

### Test data

Test personas and addresses are isolated from production-domain data.

They exist only to support deterministic simulated services and automated
tests.

No real personal data should be included in the official test dataset.
