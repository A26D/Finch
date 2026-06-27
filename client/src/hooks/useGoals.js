import { useState, useEffect, useCallback } from "react";
import { getGoals, createGoal, updateGoal, deleteGoal, contributeToGoal } from "../services/goals";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

export default function useGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const res = await getGoals(USER_ID);
    setGoals(res.data);
  }, []);

  useEffect(() => {
    fetchAll().catch(console.error).finally(() => setLoading(false));
  }, [fetchAll]);

  const handleCreate = useCallback(
    async (data) => {
      await createGoal({ ...data, user_id: USER_ID });
      await fetchAll();
    },
    [fetchAll]
  );

  const handleUpdate = useCallback(
    async (id, data) => {
      await updateGoal(id, data);
      await fetchAll();
    },
    [fetchAll]
  );

  const handleDelete = useCallback(
    async (id) => {
      await deleteGoal(id);
      await fetchAll();
    },
    [fetchAll]
  );

  const handleContribute = useCallback(
    async (id, amount) => {
      await contributeToGoal(id, amount);
      await fetchAll();
    },
    [fetchAll]
  );

  return {
    goals,
    loading,
    createGoal: handleCreate,
    updateGoal: handleUpdate,
    deleteGoal: handleDelete,
    contributeToGoal: handleContribute,
    refetch: fetchAll,
  };
}

export { USER_ID };
