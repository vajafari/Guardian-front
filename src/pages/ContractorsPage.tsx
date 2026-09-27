import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteContractor, listContractors } from '../api/contractorService';
import type { Contractor } from '../types/contractor';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { ContractorFormDialog } from '../components/ContractorFormDialog';

export function ContractorsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);

  const load = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await listContractors();
      setContractors(result);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditingContractor(null);
    setIsFormOpen(true);
  };

  const openEdit = (contractor: Contractor) => {
    setEditingContractor(contractor);
    setIsFormOpen(true);
  };

  const handleDelete = async (contractor: Contractor) => {
    if (!window.confirm(t('contractors.deleteConfirm', { title: contractor.title }))) {
      return;
    }
    try {
      await deleteContractor(contractor.id);
      load();
    } catch {
      setHasError(true);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('contractors.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('contractors.addButton')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} />
        </div>
      ) : hasError ? (
        <Alert type="danger" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <span>{t('contractors.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('contractors.retry')}
            </Button>
          </div>
        </Alert>
      ) : contractors.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('contractors.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('contractors.fields.title')}
                </th>
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('contractors.fields.subjectOfActivity')}
                </th>
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('contractors.fields.phoneNumber')}
                </th>
                <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                  {t('contractors.fields.isActive')}
                </th>
                <th className="py-2 px-3 text-end font-semibold text-gray-500 dark:text-gray-400" />
              </tr>
            </thead>
            <tbody>
              {contractors.map((contractor) => (
                <tr
                  key={contractor.id}
                  onClick={() => navigate(`/contractors/${contractor.id}`)}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer"
                >
                  <td className="py-2 px-3">{contractor.title}</td>
                  <td className="py-2 px-3">{contractor.subjectOfActivity ?? '—'}</td>
                  <td className="py-2 px-3">{contractor.phoneNumber ?? '—'}</td>
                  <td className="py-2 px-3">{contractor.isActive ? t('persons.detail.yes') : t('persons.detail.no')}</td>
                  <td className="py-2 px-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="plain"
                        size="xs"
                        icon={<HiOutlinePencil />}
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(contractor);
                        }}
                      />
                      <Button
                        variant="plain"
                        size="xs"
                        icon={<HiOutlineTrash />}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(contractor);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ContractorFormDialog
        isOpen={isFormOpen}
        contractor={editingContractor}
        onClose={() => setIsFormOpen(false)}
        onSaved={load}
      />
    </Card>
  );
}
