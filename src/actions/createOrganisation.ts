import { isUndefined, isFinite, toNumber } from "lodash";

import { Visibility } from "../models/enums";
import { Organization } from "../models/organization";
import { ComponentConfig } from "../models/componentConfig";
import { OrganizationIn } from "../models/organizationIn";

import { APIClient } from "../apiclient";

/**
 * createOrganisation creates a new org.
 *
 * @param data incoming messages which is empty for triggers
 * @param cfg object to retrieve triggers configuration values
 * @param snapshot the scratchpad for persitence between execution runs
 *
 * @returns promise resolving a message to be emitted to the platform
 */
export async function createOrganisation(msg: elasticionode.Message, cfg: ComponentConfig, snapshot: any): Promise<Organization> {
    console.log("Msg content:");
    console.log(msg);
    console.log("Cfg content:");
    console.log(cfg);
    console.log("snapshot content:");
    console.log(snapshot);

    // Get the input data
    let data = <OrganizationIn>msg.body;

    // Generate the config for https request
    if (isUndefined(cfg)) {
        throw new Error("cfg is undefined");
    }
    if (isUndefined(cfg.token)) {
        throw new Error("API token is undefined");
    }
    if (isUndefined(cfg.company_domain)) {
        throw new Error("Company domain is undefined");
    }

    // Client init
    cfg.token = cfg.token.trim();
    cfg.company_domain = cfg.company_domain.trim();
    let client = new APIClient(cfg.company_domain, cfg.token);



    let ownerId = toNumber(cfg.owner_id);
    let ownerIdFlag = isFinite(ownerId);

    // Create Organization, private by default
    let organization = {
        org_name: data.org_name,
    } as Organization;
    // Check availability of other owner_id definitions
    if (data.owner_id) {
        organization.owner_id = data.owner_id;
    } else if (ownerIdFlag) {
        organization.owner_id = ownerId;
    }
    // Set visibility enum, API allows it to be omitted
    switch (data.org_visible_to) {
        case 1:
            organization.org_visible_to = Visibility.OwnerAndFollowers;
            break;
        case 2:
            organization.org_visible_to = Visibility.EntireCompany;
            break;
    }
    console.log("Creating organization: " + JSON.stringify(organization));
    organization = await client.createOrganization(organization);
    console.log("Created organization: " + JSON.stringify(organization));
    // assign returned id to org_id
    let ret = <Organization>data;
    ret.org_id = organization.org_id;
    // Return message
    return ret;
}
