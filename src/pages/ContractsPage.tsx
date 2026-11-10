import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi';
import { deleteContract, getContractById, mapContractGridRow, type ContractGridRow } from '../api/contractService';
import { CONTRACT_ENDPOINTS } from '../api/config';
import type { ContractEditModel, ContractFullInfo } from '../types/contract';
import { Alert, Button, Card } from '../components/ui';
import { ContractFormDialog } from '../components/ContractFormDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { GridView, type GridViewHandle } from '../components/GridView';

export function ContractsPage() {
  const { t } = useTranslation();
  const gridRef = useRef<GridViewHandle>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractEditModel | null>(null);
  const [deletingContract, setDeletingContract] = useState<ContractFullInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const openAdd = () => {
    setEditingContract(null);
    setIsFormOpen(true);
  };

  const openEdit = async (row: ContractGridRow) => {
    const fullInfo = mapContractGridRow(row);
    setHasError(false);
    try {
      const detail = await getContractById(row.Id);
      setEditingContract({
        ...fullInfo,
        contractPersonsFullInfo: detail?.contractPersonsFullInfo ?? [],
        contractPaymentDetailsFullInfo: detail?.contractPaymentDetailsFullInfo ?? [],
      });
      setIsFormOpen(true);
    } catch {
      setHasError(true);
    }
  };

  const confirmDelete = async () => {
    if (!deletingContract) return;
    setIsDeleting(true);
    try {
      await deleteContract(deletingContract.id);
      setDeletingContract(null);
      gridRef.current?.reload();
    } catch {
      setHasError(true);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h1>{t('contracts.title')}</h1>
        <Button variant="solid" size="sm" icon={<HiOutlinePlus />} onClick={openAdd}>
          {t('contracts.addButton')}
        </Button>
      </div>

      <GridView<ContractGridRow>
        ref={gridRef}
        dataUrl={CONTRACT_ENDPOINTS.gridView}
        rowKey={(row) => row.Id}
        emptyText={t('contracts.empty')}
        columns={[
          {
            propertyName: 'Title',
            header: t('contracts.fields.title'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'ContractNumber',
            header: t('contracts.fields.contractNumber'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'ContractType',
            header: t('contracts.fields.contractType'),
            render: (row) => t(`contracts.contractTypes.${row.ContractType}`),
          },
          {
            propertyName: 'BuildingTitle',
            header: t('contracts.fields.building'),
            sortable: true,
            filterOperator: 'like',
          },
          {
            propertyName: 'BuildingUnitTitle',
            header: t('contracts.fields.target'),
            render: (row) => row.BuildingUnitTitle || row.BuildingSpaceTitle || '—',
          },
          {
            propertyName: 'StartDate',
            header: t('contracts.fields.startDate'),
            sortable: true,
          },
          {
            propertyName: 'EndDate',
            header: t('contracts.fields.endDate'),
            render: (row) => row.EndDate || '—',
          },
          {
            propertyName: 'ContractPersonCount',
            header: t('contracts.fields.contractPersonCount'),
          },
        ]}
        actions={(row) => (
          <>
            <Button variant="plain" size="xs" icon={<HiOutlinePencil />} onClick={() => openEdit(row)} />
            <Button
              variant="plain"
              size="xs"
              icon={<HiOutlineTrash />}
              onClick={() => setDeletingContract(mapContractGridRow(row))}
            />
          </>
        )}
      />

      {hasError && (
        <Alert type="danger" className="mt-2">
          {t('contracts.loadError')}
        </Alert>
      )}

      <ContractFormDialog
        isOpen={isFormOpen}
        contract={editingContract}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => gridRef.current?.reload()}
      />

      <ConfirmDialog
        isOpen={!!deletingContract}
        message={t('contracts.deleteConfirm', { title: deletingContract?.title })}
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setDeletingContract(null)}
      />
    </Card>
  );
}
