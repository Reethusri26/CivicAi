import Department from "../models/Department.js";
import Worker from "../models/Worker.js";
import { DEFAULT_DEPARTMENTS, LEGACY_DEPARTMENT_NAMES } from "../config/constants.js";

// Creates the default departments on an empty database and maps workers
// created by the original seed script ("Garbage", "Others") onto them.
export const ensureDefaultDepartments = async () => {
  if ((await Department.estimatedDocumentCount()) === 0) {
    await Department.insertMany(DEFAULT_DEPARTMENTS);
  }

  for (const [legacy, current] of Object.entries(LEGACY_DEPARTMENT_NAMES)) {
    if (!(await Department.exists({ name: legacy }))) {
      await Worker.updateMany({ department: legacy }, { department: current });
    }
  }
};

export const departmentForCategory = async (category) => {
  const department = await Department.findOne({ categories: category }).lean();
  return department?.name || "";
};

export const listDepartmentNames = async () =>
  (await Department.find({}, "name").lean()).map((department) => department.name);
