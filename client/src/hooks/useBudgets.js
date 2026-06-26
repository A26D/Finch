import { useState, useEffect, useCallback } from "react";
import { getBudgets, createBudget, updateBudget, deleteBudget } from "../services/budgets";
import { getCategories } from "../services/categories";
import { getAccounts } from "../services/accounts";

const USER_ID = "860e5c75-ad13-454d-899d-f140a3767fb6";

export default function useBudgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [bRes, cRes, aRes] = await Promise.all([
      getBudgets(USER_ID),
      getCategories(USER_ID),
      getAccounts(USER_ID),
    ]);
    setBudgets(bRes.data);
    setCategories(cRes.data);
    setAccounts(aRes.data);
  }, []);

  useEffect(() => {
    fetchAll().catch(console.error).finally(() => setLoading(false));
  }, [fetchAll]);

  const handleCreate = useCallback(
    async (data) => {
      await createBudget({ ...data, user_id: USER_ID });
      await fetchAll();
    },
    [fetchAll]
  );

  const handleUpdate = useCallback(
    async (id, data) => {
      await updateBudget(id, data);
      await fetchAll();
    },
    [fetchAll]
  );

  const handleDelete = useCallback(
    async (id) => {
      await deleteBudget(id);
      await fetchAll();
    },
    [fetchAll]
  );

  return {
    budgets,
    categories,
    accounts,
    loading,
    createBudget: handleCreate,
    updateBudget: handleUpdate,
    deleteBudget: handleDelete,
    refetch: fetchAll,
  };
}
