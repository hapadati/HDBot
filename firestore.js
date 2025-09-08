// firestore.js
import { db } from "./firebase.js";

// 📌 ユーザーポイント管理
export async function addUserPoints(guildId, userId, amount) {
  const ref = db.collection("guilds").doc(guildId).collection("points").doc(userId);
  const doc = await ref.get();

  if (!doc.exists) {
    await ref.set({ points: amount });
  } else {
    await ref.update({ points: (doc.data().points || 0) + amount });
  }
}

export async function getUserPoints(guildId, userId) {
  const ref = db.collection("guilds").doc(guildId).collection("points").doc(userId);
  const doc = await ref.get();
  return doc.exists ? doc.data().points : 0;
}

export async function getRanking(guildId, limit = 10) {
  const snapshot = await db
    .collection("guilds")
    .doc(guildId)
    .collection("points")
    .orderBy("points", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map(doc => ({
    userId: doc.id,
    points: doc.data().points,
  }));
}

// 📌 アイテム管理
export async function addItem(guildId, name, price, stock) {
  const ref = db.collection("guilds").doc(guildId).collection("items").doc(name);
  await ref.set({ price, stock }, { merge: true });
}

export async function getItems(guildId) {
  const snapshot = await db.collection("guilds").doc(guildId).collection("items").get();
  return snapshot.docs.map(doc => ({ name: doc.id, ...doc.data() }));
}

export async function buyItem(guildId, userId, itemName) {
  const itemRef = db.collection("guilds").doc(guildId).collection("items").doc(itemName);
  const userRef = db.collection("guilds").doc(guildId).collection("points").doc(userId);

  return db.runTransaction(async (t) => {
    const itemDoc = await t.get(itemRef);
    if (!itemDoc.exists) throw new Error("アイテムが存在しません");
    const item = itemDoc.data();

    if (item.stock <= 0) throw new Error("在庫がありません");

    const userDoc = await t.get(userRef);
    const userPoints = userDoc.exists ? userDoc.data().points : 0;

    if (userPoints < item.price) throw new Error("ポイントが足りません");

    // 更新処理
    t.update(itemRef, { stock: item.stock - 1 });
    t.set(userRef, { points: userPoints - item.price }, { merge: true });

    return { success: true, itemName, remainingPoints: userPoints - item.price };
  });
}

export async function deleteItem(guildId, itemName, force = false) {
  const ref = db.collection("guilds").doc(guildId).collection("items").doc(itemName);
  const doc = await ref.get();

  if (!doc.exists) throw new Error("アイテムが存在しません");

  if (!force && doc.data().stock > 0) {
    throw new Error("在庫が残っているため削除できません");
  }

  await ref.delete();
  return { success: true };
}
