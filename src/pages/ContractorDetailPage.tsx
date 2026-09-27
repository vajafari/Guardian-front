import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { getContractorById } from '../api/contractorService';
import { deleteContractorContract } from '../api/contractorContractService';
import type { ContractorFullInfo } from '../types/contractor';
import type { ContractorContract } from '../types/contractorContract';
import { Alert, Button, Card, Spinner } from '../components/ui';
import { ContractorFormDialog } from '../components/ContractorFormDialog';
import { ContractorContractFormDialog } from '../components/ContractorContractFormDialog';

export function ContractorDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [contractor, setContractor] = useState<ContractorFullInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isContractFormOpen, setIsContractFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractorContract | null>(null);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    setHasError(false);
    try {
      const result = await getContractorById(id);
      setContractor(result);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openAddContract = () => {
    setEditingContract(null);
    setIsContractFormOpen(true);
  };

  const openEditContract = (contract: ContractorContract) => {
    setEditingContract(contract);
    setIsContractFormOpen(true);
  };

  const handleDeleteContract = async (contract: ContractorContract) => {
    if (!window.confirm(t('contractorContracts.deleteConfirm', { title: contract.title }))) {
      return;
    }
    try {
      await deleteContractorContract(contract.id);
      load();
    } catch {
      setHasError(true);
    }
  };

  const infoFields: Array<{ label: string; value: string }> = contractor
    ? [
        { label: t('contractors.fields.subjectOfActivity'), value: contractor.subjectOfActivity ?? '—' },
        { label: t('contractors.fields.phoneNumber'), value: contractor.phoneNumber ?? '—' },
        { label: t('contractors.fields.economicCode'), value: contractor.economicCode ?? '—' },
        { label: t('contractors.fields.address'), value: contractor.address ?? '—' },
        { label: t('contractors.fields.startDate'), value: contractor.startDate?.slice(0, 10) ?? '—' },
        { label: t('contractors.fields.endDate'), value: contractor.endDate?.slice(0, 10) ?? '—' },
        { label: t('contractors.fields.isActive'), value: contractor.isActive ? t('persons.detail.yes') : t('persons.detail.no') },
        { label: t('contractors.fields.description'), value: contractor.description ?? '—' },
      ]
    : [];

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="plain" size="sm" icon={<HiOutlineArrowLeft />} onClick={() => navigate('/contractors')}>
            {t('contractors.detail.back')}
          </Button>
          <h1>{contractor ? contractor.title : t('contractors.title')}</h1>
        </div>
        {contractor && (
          <Button size="sm" icon={<HiOutlinePencil />} onClick={() => setIsEditOpen(true)}>
            {t('contractors.editTitle')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size={28} />
        </div>
      ) : hasError ? (
        <Alert type="danger" className="mb-2">
          <div className="flex items-center justify-between gap-4">
            <span>{t('contractors.detail.loadError')}</span>
            <Button size="sm" onClick={load}>
              {t('contractors.retry')}
            </Button>
          </div>
        </Alert>
      ) : !contractor ? (
        <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('contractors.detail.notFound')}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 mb-6">
            {infoFields.map((field) => (
              <div key={field.label}>
                <div className="text-xs text-gray-500 dark:text-gray-400">{field.label}</div>
                <div className="text-sm">{field.value}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-3 mt-2">
            <h4>{t('contractorContracts.title')}</h4>
            <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAddContract}>
              {t('contractorContracts.addButton')}
            </Button>
          </div>

          {contractor.contractsFullInfo.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 py-6 text-center">{t('contractorContracts.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-start">
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('contractorContracts.fields.title')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('contractorContracts.fields.contractNumber')}
                    </th>
                    <th className="py-2 px-3 text-start font-semibold text-gray-500 dark:text-gray-400">
                      {t('contractorContracts.fields.isActive')}
                    </th>
                    <th className="py-2 px-3 text-end font-semibold text-gray-500 dark:text-gray-400" />
                  </tr>
                </thead>
                <tbody>
                  {contractor.contractsFullInfo.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/40"
                    >
                      <td className="py-2 px-3">{contract.title}</td>
                      <td className="py-2 px-3">{contract.contractNumber}</td>
                      <td className="py-2 px-3">{contract.isActive ? t('persons.detail.yes') : t('persons.detail.no')}</td>
                      <td className="py-2 px-3 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="plain"
                            size="xs"
                            icon={<HiOutlinePencil />}
                            onClick={() => openEditContract(contract)}
                          />
                          <Button
                            variant="plain"
                            size="xs"
                            icon={<HiOutlineTrash />}
                            onClick={() => handleDeleteContract(contract)}
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
            isOpen={isEditOpen}
            contractor={contractor}
            onClose={() => setIsEditOpen(false)}
            onSaved={load}
          />
          <ContractorContractFormDialog
            isOpen={isContractFormOpen}
            contractorId={contractor.id}
            contract={editingContract}
            onClose={() => setIsContractFormOpen(false)}
            onSaved={load}
          />
        </>
      )}
    </Card>
  );
}
