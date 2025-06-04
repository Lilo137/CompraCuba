// src/order/dto/create-order.dto.ts
export class CreateOrderDto {
  userID: number;
  // Dos opciones:
  // 1) Recibir la lista de productos y cantidades directamente:
  products: { productId: number; cantidad: number }[];
  // 2) O bien decidir que la orden se arme a partir del carrito interno (sin pasar lista).
}
