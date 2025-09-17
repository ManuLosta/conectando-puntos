import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const userService = {
  /**
   * Get the distributor ID for a user based on their role and tenant relationships
   */
  async getDistributorIdForUser(userId: string): Promise<string | null> {
    try {
      // First, get the user with their role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          userTenants: {
            select: {
              distributorId: true,
              role: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      // If user is SUPER_ADMIN, they can access any distributor
      // For now, we'll return the first distributor they're associated with
      // In a real app, you might want to let them choose or show all distributors
      if (user.role === "SUPER_ADMIN") {
        const firstTenant = user.userTenants[0];
        return firstTenant?.distributorId || null;
      }

      // For TENANT_USER, get their distributor from userTenants
      if (user.role === "TENANT_USER") {
        const userTenant = user.userTenants[0]; // Assuming one distributor per user for now
        return userTenant?.distributorId || null;
      }

      return null;
    } catch (error) {
      console.error("Error getting distributor ID for user:", error);
      return null;
    }
  },

  /**
   * Get user's tenant information including distributor details
   */
  async getUserTenantInfo(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          userTenants: {
            include: {
              distributor: {
                select: {
                  id: true,
                  name: true,
                  isActive: true,
                },
              },
            },
          },
        },
      });

      return user;
    } catch (error) {
      console.error("Error getting user tenant info:", error);
      return null;
    }
  },
};
