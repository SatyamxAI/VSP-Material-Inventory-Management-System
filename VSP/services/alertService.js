/**
 * VSP Material Inventory Management System
 * Alert Service
 *
 * Handles automatic alert creation and resolution based on
 * material stock levels vs. reorder thresholds.
 */

const Material = require('../models/Material');
const Alert = require('../models/Alert');

/**
 * Checks a material's stock level against its reorder level
 * and creates or resolves alerts accordingly.
 *
 * - If current_stock <= reorder_level and no active alert exists,
 *   a new alert is created with alert_type 'Low Stock'.
 * - If current_stock > reorder_level, any active alerts for the
 *   material are resolved automatically.
 *
 * NOTE: This function catches its own errors so that alert failures
 * never break the calling business-logic flow.
 *
 * @param {number} materialId - The ID of the material to check
 * @returns {Promise<void>}
 */
const checkAndCreateAlerts = async (materialId) => {
  try {
    const material = await Material.findById(materialId);
    if (!material) {
      console.error(`Alert check failed: Material ID ${materialId} not found`);
      return;
    }

    const currentStock = Number(material.current_stock);
    const reorderLevel = Number(material.reorder_level);

    if (currentStock <= reorderLevel) {
      // Stock is at or below reorder level — create alert if none exists
      // Alert.findByMaterial already filters to Active alerts only
      const activeAlerts = await Alert.findByMaterial(materialId);

      if (activeAlerts.length === 0) {
        const message = `${material.material_name} stock (${currentStock}) is below reorder level (${reorderLevel})`;
        await Alert.create({
          material_id: materialId,
          alert_type: 'Low Stock',
          message,
        });
        console.log(`Alert created for material "${material.material_name}" (ID: ${materialId})`);
      }
    } else {
      // Stock is above reorder level — resolve any active alerts
      const activeAlerts = await Alert.findByMaterial(materialId);

      for (const alert of activeAlerts) {
        await Alert.resolve(alert.id);
        console.log(`Alert ${alert.id} resolved for material "${material.material_name}" (ID: ${materialId})`);
      }
    }
  } catch (error) {
    // Log but don't throw — alert failures shouldn't break the main flow
    console.error(`Alert service error for material ${materialId}:`, error.message);
  }
};

module.exports = {
  checkAndCreateAlerts,
};
