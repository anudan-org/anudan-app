import {Section, WorkflowStatus} from './dahsboard';

export class AppConfig {
  appName: string;
  logoUrl: string;
  navbarColor: string;
  navbarTextColor: string;
  tenantCode: string;
  defaultSections: Section[];
  submissionInitialStatus: WorkflowStatus;
  grantInitialStatus: WorkflowStatus;
}

export class Colors {
  colorArray = ['#E6331A',
    '#B366CC', '#4D8000', '#B33300', '#CC80CC',
    '#66664D', '#991AFF', '#E666FF', '#4DB3FF', '#1AB399',
    '#E666B3', '#33991A', '#CC9999', '#B3B31A', '#00E680',
    '#4D8066', '#809980', '#E6FF80', '#1AFF33', '#999933',
    '#FF3380', '#CCCC00', '#66E64D', '#4D80CC', '#9900B3',
    '#E64D66', '#4DB380', '#FF4D4D', '#99E6E6', '#6666FF'];
}
