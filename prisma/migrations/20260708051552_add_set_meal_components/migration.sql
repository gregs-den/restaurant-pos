-- CreateTable
CREATE TABLE "set_meal_components" (
    "id" TEXT NOT NULL,
    "set_menu_item_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "set_meal_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_components" (
    "id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "is_substituted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_item_components_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "set_meal_components" ADD CONSTRAINT "set_meal_components_set_menu_item_id_fkey" FOREIGN KEY ("set_menu_item_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_meal_components" ADD CONSTRAINT "set_meal_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_components" ADD CONSTRAINT "order_item_components_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_components" ADD CONSTRAINT "order_item_components_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
