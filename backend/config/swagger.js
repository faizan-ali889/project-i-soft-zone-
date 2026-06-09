const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Employee Leave Management & Approval Workflow API",
    version: "1.0.0",
    description: "Enterprise REST API documentation for employee leave request validation, multi-level approvals, and role management."
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Local development server"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: "Enter your JWT token directly"
      }
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"] },
          reporting_manager_id: { type: "integer" }
        }
      },
      LeaveApplication: {
        type: "object",
        properties: {
          id: { type: "integer" },
          employee_id: { type: "integer" },
          leave_type_id: { type: "integer" },
          from_date: { type: "string", format: "date" },
          to_date: { type: "string", format: "date" },
          total_days: { type: "integer" },
          reason: { type: "string" },
          status: { type: "string", enum: ["PENDING", "APPROVED", "REJECTED"] },
          remarks: { type: "string" }
        }
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  paths: {
    "/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "User registered successfully" },
          400: { description: "User already exists or validation error" }
        }
      }
    },
    "/auth/login": {
      post: {
        summary: "Authenticate user and get JWT",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string" },
                  password: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Login successful with token" },
          400: { description: "Invalid credentials" }
        }
      }
    },
    "/auth/user-profile": {
      get: {
        summary: "Get current authenticated user profile",
        tags: ["Auth"],
        responses: {
          200: { description: "User profile details" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/leaves/apply": {
      post: {
        summary: "Submit a new leave application",
        tags: ["Leaves"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["leaveTypeId", "fromDate", "toDate", "reason"],
                properties: {
                  leaveTypeId: { type: "integer" },
                  fromDate: { type: "string", format: "date" },
                  toDate: { type: "string", format: "date" },
                  reason: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Leave application submitted" },
          400: { description: "Insufficient balance or invalid dates" }
        }
      }
    },
    "/leaves/my-leaves": {
      get: {
        summary: "Get currently logged-in user's leave requests",
        tags: ["Leaves"],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" }, required: false }
        ],
        responses: {
          200: { description: "List of leaves" }
        }
      }
    },
    "/leaves/balance": {
      get: {
        summary: "Get leave balance of current user",
        tags: ["Leaves"],
        parameters: [
          { name: "year", in: "query", schema: { type: "integer" }, required: false }
        ],
        responses: {
          200: { description: "Leave balances" }
        }
      }
    },
    "/leaves/pending": {
      get: {
        summary: "Get pending leaves for Manager/HR review",
        tags: ["Leaves Approval"],
        parameters: [
          { name: "departmentId", in: "query", schema: { type: "integer" }, required: false }
        ],
        responses: {
          200: { description: "List of pending leaves" },
          403: { description: "Unauthorized" }
        }
      }
    },
    "/leaves/{leaveId}/approve": {
      put: {
        summary: "Approve a leave request",
        tags: ["Leaves Approval"],
        parameters: [
          { name: "leaveId", in: "path", required: true, schema: { type: "integer" } }
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { remarks: { type: "string" } }
              }
            }
          }
        },
        responses: {
          200: { description: "Leave approved successfully" }
        }
      }
    },
    "/leaves/{leaveId}/reject": {
      put: {
        summary: "Reject a leave request",
        tags: ["Leaves Approval"],
        parameters: [
          { name: "leaveId", in: "path", required: true, schema: { type: "integer" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["remarks"],
                properties: { remarks: { type: "string" } }
              }
            }
          }
        },
        responses: {
          200: { description: "Leave rejected successfully" }
        }
      }
    },
    "/leaves/{leaveId}/approval-history": {
      get: {
        summary: "Get history of approval/rejection for a leave request",
        tags: ["Leaves Approval"],
        parameters: [
          { name: "leaveId", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Approval history list" }
        }
      }
    },
    "/leaves/admin/audit-logs": {
      get: {
        summary: "Get system audit logs (Admin only)",
        tags: ["Admin"],
        parameters: [
          { name: "entityType", in: "query", schema: { type: "string" } },
          { name: "entityId", in: "query", schema: { type: "integer" } },
          { name: "action", in: "query", schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Audit trail log" },
          403: { description: "Unauthorized" }
        }
      }
    },
    "/leaves/admin/statistics": {
      get: {
        summary: "Get leave statistics dashboard (Admin/HR/Manager)",
        tags: ["Analytics"],
        parameters: [
          { name: "departmentId", in: "query", schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Statistics object" }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
