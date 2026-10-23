import Notification from "../models/Notification.js";

// In-app notifications. `dedupeKey` is unique, so a retried request that
// emits the same event does not create a second notification.
export const notify = async ({ audience, recipient = null, type, complaint, title, message = "", dedupeKey }) => {
  try {
    await Notification.create({
      audience,
      recipient,
      type,
      complaint: complaint?._id,
      title,
      message,
      dedupeKey: dedupeKey || `${type}:${complaint?._id}:${recipient || audience}`,
    });
  } catch (error) {
    if (error?.code !== 11000) {
      console.error("Notification failed", error.message);
    }
  }
};

const scopeFor = (user) =>
  user.role === "admin"
    ? { audience: "admin" }
    : { audience: user.role, recipient: user.id };

export const listNotifications = async (user, { limit = 30 } = {}) => {
  const items = await Notification.find(scopeFor(user)).sort({ createdAt: -1 }).limit(limit).lean();
  const unread = await Notification.countDocuments({ ...scopeFor(user), readBy: { $ne: user.id } });

  return {
    unread,
    notifications: items.map((item) => ({
      id: String(item._id),
      type: item.type,
      title: item.title,
      message: item.message,
      complaintId: item.complaint ? String(item.complaint) : null,
      createdAt: item.createdAt,
      read: item.readBy.some((id) => String(id) === user.id),
    })),
  };
};

export const markRead = async (user, ids) => {
  const filter = { ...scopeFor(user) };
  if (ids?.length) filter._id = { $in: ids };
  await Notification.updateMany(filter, { $addToSet: { readBy: user.id } });
};
