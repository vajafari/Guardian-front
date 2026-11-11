import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HiOutlineViewGrid,
  HiOutlineUsers,
  HiOutlineOfficeBuilding,
  HiOutlineBriefcase,
  HiOutlineLocationMarker,
  HiOutlineUserGroup,
  HiOutlineKey,
  HiOutlineDocumentReport,
  HiOutlineCog,
  HiOutlineCube,
  HiOutlineClipboardList,
  HiOutlineServer,
  HiOutlineSwitchVertical,
  HiOutlineCollection,
  HiOutlineVideoCamera,
  HiOutlineAcademicCap,
  HiOutlineIdentification,
  HiOutlineArchive,
  HiOutlineCurrencyDollar,
  HiOutlineCalculator,
  HiOutlineAdjustments,
  HiOutlineTicket,
  HiOutlineReceiptTax,
  HiOutlineClock,
  HiOutlineCreditCard,
  HiOutlineCash,
  HiOutlineDocumentText,
  HiOutlineSwitchHorizontal,
  HiOutlineScale,
} from 'react-icons/hi';
import { Menu, MenuItem } from './ui';

type MenuLeaf = { key: string; icon: (typeof HiOutlineViewGrid); path: string | null };

const STANDALONE_ITEMS: MenuLeaf[] = [{ key: 'dashboard', icon: HiOutlineViewGrid, path: '/dashboard' }];

const MENU_GROUPS: Array<{ key: string; icon: typeof HiOutlineViewGrid; items: MenuLeaf[] }> = [
  {
    key: 'personnelGroup',
    icon: HiOutlineUsers,
    items: [
      { key: 'persons', icon: HiOutlineUsers, path: '/persons' },
      { key: 'personGroups', icon: HiOutlineCollection, path: '/person-groups' },
      { key: 'fieldOfStudies', icon: HiOutlineAcademicCap, path: '/field-of-studies' },
      { key: 'positions', icon: HiOutlineIdentification, path: '/positions' },
    ],
  },
  {
    key: 'propertyGroup',
    icon: HiOutlineOfficeBuilding,
    items: [
      { key: 'buildings', icon: HiOutlineOfficeBuilding, path: '/buildings' },
      { key: 'buildingSpaces', icon: HiOutlineCube, path: '/building-spaces' },
      { key: 'contracts', icon: HiOutlineClipboardList, path: '/contracts' },
      { key: 'contractors', icon: HiOutlineBriefcase, path: '/contractors' },
    ],
  },
  {
    key: 'hardwareGroup',
    icon: HiOutlineServer,
    items: [
      { key: 'devices', icon: HiOutlineServer, path: '/devices' },
      { key: 'cameras', icon: HiOutlineVideoCamera, path: '/cameras' },
      { key: 'cabinetRooms', icon: HiOutlineArchive, path: '/cabinet-rooms' },
      { key: 'elevators', icon: HiOutlineSwitchVertical, path: '/elevators' },
      { key: 'locations', icon: HiOutlineLocationMarker, path: '/locations' },
    ],
  },
  {
    key: 'finGroup',
    icon: HiOutlineCurrencyDollar,
    items: [
      { key: 'finSetup', icon: HiOutlineCurrencyDollar, path: '/fin-setup' },
      { key: 'chargePlans', icon: HiOutlineAdjustments, path: '/fin/charge-plans' },
      { key: 'serviceBillingTypes', icon: HiOutlineTicket, path: '/fin/service-billing-types' },
      { key: 'chargeIssues', icon: HiOutlineCalculator, path: '/fin/charge-issues' },
      { key: 'serviceBillings', icon: HiOutlineReceiptTax, path: '/fin/service-billings' },
      { key: 'lateFeeRuns', icon: HiOutlineClock, path: '/fin/late-fee-runs' },
      { key: 'cashAccounts', icon: HiOutlineCreditCard, path: '/fin/cash-accounts' },
      { key: 'receipts', icon: HiOutlineCash, path: '/fin/receipts' },
      { key: 'cheques', icon: HiOutlineDocumentText, path: '/fin/cheques' },
      { key: 'chequeFates', icon: HiOutlineSwitchHorizontal, path: '/fin/cheque-fates' },
      { key: 'partyPayments', icon: HiOutlineScale, path: '/fin/party-payments' },
    ],
  },
  {
    key: 'accessGroup',
    icon: HiOutlineKey,
    items: [
      { key: 'userGroups', icon: HiOutlineUserGroup, path: '/user-groups' },
      { key: 'users', icon: HiOutlineKey, path: '/users' },
    ],
  },
];

const TRAILING_ITEMS: MenuLeaf[] = [
  { key: 'reports', icon: HiOutlineDocumentReport, path: null },
  { key: 'settings', icon: HiOutlineCog, path: null },
];

const ALL_LEAVES: MenuLeaf[] = [...STANDALONE_ITEMS, ...MENU_GROUPS.flatMap((group) => group.items), ...TRAILING_ITEMS];

const SIDE_NAV_WIDTH = 200;

export function SideMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey = ALL_LEAVES.find((item) => item.path === location.pathname)?.key ?? 'dashboard';
  const activeGroup = MENU_GROUPS.find((group) => group.items.some((item) => item.key === activeKey));

  const handleSelect = (key: string) => {
    const item = ALL_LEAVES.find((menuItem) => menuItem.key === key);
    if (item?.path) {
      navigate(item.path);
    }
  };

  return (
    <div
      className="flex flex-col flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700"
      style={{ width: SIDE_NAV_WIDTH, minWidth: SIDE_NAV_WIDTH }}
    >
      <div className="p-3">
        <Menu
          defaultExpandedKeys={activeGroup ? [activeGroup.key] : []}
          defaultCollapseActiveKeys={activeGroup ? [activeGroup.key] : []}
        >
          <Menu.MenuGroup label={t('menu.groupTitle')}>
            {STANDALONE_ITEMS.map(({ key, icon: Icon }) => (
              <MenuItem key={key} eventKey={key} isActive={key === activeKey} onSelect={handleSelect}>
                <Icon className="text-xl" />
                <span>{t(`menu.${key}`)}</span>
              </MenuItem>
            ))}

            {MENU_GROUPS.map((group) => (
              <Menu.MenuCollapse
                key={group.key}
                eventKey={group.key}
                active={group.key === activeGroup?.key}
                label={
                  <span className="flex items-center gap-2">
                    <group.icon className="text-xl" />
                    <span>{t(`menu.${group.key}`)}</span>
                  </span>
                }
              >
                {group.items.map(({ key, icon: Icon }) => (
                  <MenuItem key={key} eventKey={key} isActive={key === activeKey} onSelect={handleSelect}>
                    <Icon className="text-xl" />
                    <span>{t(`menu.${key}`)}</span>
                  </MenuItem>
                ))}
              </Menu.MenuCollapse>
            ))}

            {TRAILING_ITEMS.map(({ key, icon: Icon }) => (
              <MenuItem key={key} eventKey={key} isActive={key === activeKey} onSelect={handleSelect}>
                <Icon className="text-xl" />
                <span>{t(`menu.${key}`)}</span>
              </MenuItem>
            ))}
          </Menu.MenuGroup>
        </Menu>
      </div>
    </div>
  );
}
