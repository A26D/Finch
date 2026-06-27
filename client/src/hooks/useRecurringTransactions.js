import { useState, useEffect, useCallback } from "react";
import {
  getRecurringTransactions,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
} from "../services/recurringTransactions";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

export default function useRecurringTransactions() {
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const res = await getRecurringTransactions(USER_ID);
    setRecurringTransactions(res.data);
  }, []);

  useEffect(() => {
    fetchAll().catch(console.error).finally(() => setLoading(false));
  }, [fetchAll]);

  const handleCreate = useCallback(
    async (data) => {
      await createRecurringTransaction({ ...data, user_id: USER_ID });
      await fetchAll();
    },
    [fetchAll]
  );

  const handleUpdate = useCallback(
    async (id, data) => {
      await updateRecurringTransaction(id, data);
      await fetchAll();
    },
    [fetchAll]
  );

  const handleDelete = useCallback(
    async (id) => {
      await deleteRecurringTransaction(id);
      await fetchAll();
    },
    [fetchAll]
  );

  const handlePause = useCallback(
    async (id) => {
      await pauseRecurringTransaction(id);
      await fetchAll();
    },
    [fetchAll]
  );

  const handleResume = useCallback(
    async (id) => {
      await resumeRecurringTransaction(id);
      await fetchAll();
    },
    [fetchAll]
  );

  return {
    recurringTransactions,
    loading,
    createRecurringTransaction: handleCreate,
    updateRecurringTransaction: handleUpdate,
    deleteRecurringTransaction: handleDelete,
    pauseRecurringTransaction: handlePause,
    resumeRecurringTransaction: handleResume,
    refetch: fetchAll,
  };
}

export { USER_ID };
