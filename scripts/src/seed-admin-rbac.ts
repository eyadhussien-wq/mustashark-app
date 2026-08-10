import { db } from "@workspace/db";
import {
  adminRolesTable,
  adminPermissionsTable,
  adminRolePermissionsTable,
} from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

const roles = [
  {
    name: "Super Admin",
    description: "صلاحيات كاملة على النظام",
  },
  {
    name: "Operations Admin",
    description: "إدارة المستخدمين والمحامين والاستشارات",
  },
  {
    name: "Finance Admin",
    description: "إدارة الدفعات والمحافظ والعمولات",
  },
  {
    name: "Support Admin",
    description: "إدارة الدعم وخدمة العملاء",
  },
  {
    name: "Compliance Admin",
    description: "مراجعة الوثائق والسجلات القانونية",
  },
];

const permissions = [
  ["users.view", "عرض المستخدمين"],
  ["users.edit_basic", "تعديل البيانات الأساسية"],
  ["users.edit_sensitive", "تعديل البيانات الحساسة"],
  ["users.suspend", "تعليق الحسابات"],
  ["users.terminate", "إنهاء الحسابات"],

  ["lawyers.view", "عرض المحامين"],
  ["lawyers.approve", "اعتماد المحامين"],
  ["lawyers.reject", "رفض طلبات المحامين"],
  ["lawyers.verify_license", "التحقق من الترخيص"],

  ["consultations.view", "عرض الاستشارات"],
  ["consultations.manage", "إدارة الاستشارات"],
  ["consultations.transfer", "تحويل الاستشارات"],

  ["payments.view", "عرض الدفعات"],
  ["payments.refund", "إدارة الاسترجاع"],
  ["payments.release_escrow", "إفراج مبالغ Escrow"],

  ["escrow.manage", "إدارة نظام الحجز المالي"],

  ["commissions.view", "عرض العمولات"],
  ["commissions.manage", "إدارة العمولات"],

  ["audit.view", "عرض سجل العمليات"],
  ["settings.manage", "إدارة إعدادات النظام"],
];

async function getOrCreateRole(name: string, description: string) {
  const existing = await db
    .select()
    .from(adminRolesTable)
    .where(eq(adminRolesTable.name, name))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const created = await db
    .insert(adminRolesTable)
    .values({
      id: randomUUID(),
      name,
      description,
    })
    .returning();

  return created[0];
}

async function getOrCreatePermission(
  key: string,
  description: string
) {
  const existing = await db
    .select()
    .from(adminPermissionsTable)
    .where(eq(adminPermissionsTable.key, key))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const created = await db
    .insert(adminPermissionsTable)
    .values({
      id: randomUUID(),
      key,
      description,
    })
    .returning();

  return created[0];
}

async function seed() {
  const createdRoles = [];

  for (const role of roles) {
    createdRoles.push(
      await getOrCreateRole(role.name, role.description)
    );
  }

  const createdPermissions = [];

  for (const permission of permissions) {
    createdPermissions.push(
      await getOrCreatePermission(
        permission[0],
        permission[1]
      )
    );
  }

  const superAdmin = createdRoles.find(
    (role) => role.name === "Super Admin"
  );

  if (superAdmin) {
    for (const permission of createdPermissions) {
      const existing = await db
        .select()
        .from(adminRolePermissionsTable)
        .where(
          and(
            eq(
              adminRolePermissionsTable.roleId,
              superAdmin.id
            ),
            eq(
              adminRolePermissionsTable.permissionId,
              permission.id
            )
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(adminRolePermissionsTable).values({
          id: randomUUID(),
          roleId: superAdmin.id,
          permissionId: permission.id,
        });
      }
    }
  }

  console.log("RBAC seed completed successfully");
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
