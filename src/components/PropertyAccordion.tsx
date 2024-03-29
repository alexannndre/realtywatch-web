import { Group, Text, Accordion, ActionIcon, Tooltip, Title, Skeleton } from "@mantine/core";
import {
  IconChartInfographic,
  IconChartLine,
  IconLink,
  IconListDetails,
  IconMapPin,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import { useEffect, type ReactNode, useState } from "react";
import { sortBy } from "remeda";
import { completeAddress, numberToString, priceToString, propertyDetailsResume, ucfirst } from "~/lib/propertyHelper";
import { type Offer, type Property } from "~/types";
import { ConfirmationModal } from "./ConfirmationModal";
import { useDisclosure } from "@mantine/hooks";
import { makeRequest } from "~/lib/requestHelper";
import { errorNotification, successNotification } from "./PropertyCard";
import { useSession } from "next-auth/react";
import { PropertyOfferHistoryChart } from "./PropertyOfferHistoryChart";

interface AccordionLabelProps {
  label: string;
  icon: React.ElementType;
  description: string;
}

function AccordionLabel({ label, icon: Icon, description }: AccordionLabelProps) {
  return (
    <Group noWrap>
      <Icon size="2rem" stroke="1.5" />
      <div>
        <Text>{label}</Text>
        <Text size="sm" color="dimmed" weight={400}>
          {description}
        </Text>
      </div>
    </Group>
  );
}

export type AccordionItem = {
  id: string;
  value: string;
  label: string;
  icon: React.ElementType;
  description: string;
  content: string | ReactNode;
  disabled?: boolean;
};

function LabelAndValue({ label, value }: { label: string; value: string | undefined }) {
  return value ? (
    <div>
      <Text>{label}</Text>
      <Text size="sm" color="dimmed" weight={400}>
        {value ?? "N/A"}
      </Text>
    </div>
  ) : (
    <></>
  );
}

type PropertyAccordionProps = {
  property: Property | undefined;
  isLoading?: boolean;
};

export function PropertyAccordion({ property, isLoading = false }: PropertyAccordionProps) {
  const { data: session } = useSession();

  const [modalOpened, { open, close }] = useDisclosure(false);
  const [offersSortStatus, setOffersSortStatus] = useState<DataTableSortStatus>({
    columnAccessor: "id",
    direction: "asc",
  });
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [offerRecords, setOfferRecords] = useState<Offer[]>([]);
  const [accordionValue, setAccordionValue] = useState<string[]>([]);

  const sortOffers = (sortStatus: DataTableSortStatus) => {
    // @ts-expect-error sortBy is not typed
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    const sortedOffers = sortBy(offerRecords, (offer) => offer[sortStatus.columnAccessor]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const sortedData = sortStatus.direction === "asc" ? sortedOffers : [...sortedOffers].reverse();
    setOfferRecords(sortedData);
  };

  useEffect(() => {
    sortOffers(offersSortStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offersSortStatus]);

  useEffect(() => {
    if (!property) {
      return;
    }

    if (propertyDetailsResume(property, isLoading)) {
      setAccordionValue(["details"]);
    }
  }, [property, isLoading]);

  useEffect(() => {
    if (!property?.offers) {
      return;
    }

    const offers = [
      ...property?.offers?.sale?.map((offer) => ({
        ...offer,
        price_str: offer?.price ? priceToString(offer?.price) : "N/A",
        description: offer?.description ? offer?.description : "N/A",
        listing_type: "sale",
      })),
      ...property?.offers?.rent?.map((offer) => ({
        ...offer,
        price_str: offer?.price ? priceToString(offer?.price) + "/month" : "N/A",
        description: offer?.description ? offer?.description : "N/A",
        listing_type: "rent",
      })),
    ];

    setOfferRecords(offers);
  }, [property]);

  const offerTableColumns = [
    {
      accessor: "id",
      title: "ID",
      width: 40,
      sortable: true,
    },
    {
      accessor: "listing_type",
      title: "Listing Type",
      width: 50,
      sortable: true,
      cellsClassName: "capitalize",
    },
    {
      accessor: "price_str",
      title: "Price (€)",
      width: 70,
      sortable: true,
    },
    {
      accessor: "description",
      title: "Designation",
      width: 200,
      ellipsis: true,
      sortable: true,
      render: (offer: Offer) => (
        <>
          <Tooltip label={offer.description} color="gray" position="bottom" withArrow>
            <Text style={{ textOverflow: "ellipsis", overflow: "hidden" }}>{offer.description}</Text>
          </Tooltip>
        </>
      ),
    },
    {
      accessor: "actions",
      title: "Actions",
      width: 35,
      render: (offer: Offer) => (
        <>
          <div className="flex flex-row items-center">
            <Tooltip label="Visit offer" color="gray" position="bottom" withArrow>
              <ActionIcon onClick={() => window.open(offer.url, "_blank")}>
                <IconLink size={16} />
              </ActionIcon>
            </Tooltip>
            <ActionIcon
              color="red"
              onClick={() => {
                setSelectedOffer(offer);
                open();
              }}
            >
              <IconX size={16} />
            </ActionIcon>
          </div>
        </>
      ),
    },
  ];

  const convertCharacteristicValue = (value: string, type: string) => {
    switch (type) {
      case "numerical":
        const numberValue = Number(value);
        if (Number.isNaN(numberValue)) return value;
        return numberToString(numberValue);
      case "textual":
      case "other":
      default:
        return value;
    }
  };
  const renderCharacteristics = () => {
    return property?.characteristics?.map((characteristic) => {
      return (
        <LabelAndValue
          key={characteristic.id}
          label={ucfirst(characteristic?.name)}
          value={convertCharacteristicValue(characteristic.value, characteristic.type) ?? "N/A"}
        />
      );
    });
  };

  const generateOffersDescription = (property: Property | undefined) => {
    if (isLoading) return "Loading offers...";
    if (!property) return "";

    switch (property?.listing_type) {
      case "sale":
        return `View ${property.offers?.sale?.length} sale offers`;
      case "rent":
        return `View ${property.offers?.rent?.length} rent offers`;
      case "both":
        return `View ${property.offers?.sale?.length} sale offers and ${property.offers?.rent?.length} rent offers`;
      case "none":
      default:
        return "This property has no offers";
    }
  };

  const itemList: AccordionItem[] = [
    {
      id: "details",
      value: "details",
      icon: IconListDetails,
      label: "Property Details",
      description: propertyDetailsResume(property, isLoading) || "No details available",
      content: (
        <>
          {!isLoading && property ? (
            <div style={{ display: "flex", flexWrap: "wrap", gridGap: "2rem" }}>
              <LabelAndValue label="Type" value={ucfirst(property.type?.toString())} />
              <LabelAndValue label="Typology" value={property.typology?.toString()} />
              <LabelAndValue label="Bathrooms" value={property.wc?.toString()} />
              {property.gross_area && (
                <LabelAndValue label="Gross Area" value={numberToString(parseInt(property.gross_area)) + " m²"} />
              )}
              {property.useful_area && (
                <LabelAndValue label="Net Area" value={numberToString(parseInt(property.useful_area)) + " m²"} />
              )}
              {renderCharacteristics()}
            </div>
          ) : (
            <Skeleton height="100%" />
          )}
        </>
      ),
      disabled: isLoading || (property && !propertyDetailsResume(property)),
    },
    {
      id: "address",
      value: "address",
      icon: IconMapPin,
      label: "Address",
      description: isLoading ? "Loading address..." : completeAddress(property?.address),
      content: (
        <>
          {!isLoading && property ? (
            <div style={{ display: "flex", flexWrap: "wrap", gridGap: "2rem" }}>
              <LabelAndValue label="District" value={property.address?.adm1?.toString()} />
              <LabelAndValue label="Municipality" value={property.address?.adm2?.toString()} />
              <LabelAndValue label="Parish" value={property.address?.adm3?.toString()} />
              <LabelAndValue label="Postal Code" value={property.address?.postal_code?.toString()} />
              <LabelAndValue label="Street Address" value={property.address?.full_address?.toString()} />
              <LabelAndValue label="Latitude" value={property.address?.coordinates?.latitude?.toString()} />
              <LabelAndValue label="Longitude" value={property.address?.coordinates?.longitude?.toString()} />
            </div>
          ) : (
            <Skeleton height="100%" />
          )}
        </>
      ),
      disabled: isLoading || !property?.address?.full_address,
    },
    {
      id: "offers",
      value: "offers",
      icon: IconChartLine,
      label: "Offers",
      description: generateOffersDescription(property),
      content: (
        <>
          {offerRecords.length > 0 && (
            <DataTable
              withBorder={false}
              borderRadius="md"
              columns={offerTableColumns}
              records={offerRecords}
              sortStatus={offersSortStatus}
              onSortStatusChange={setOffersSortStatus}
            />
          )}
        </>
      ),
      disabled: isLoading || (property && property?.offers?.sale?.length + property?.offers?.rent?.length === 0),
    },
    {
      id: "offers_history",
      value: "history",
      icon: IconChartInfographic,
      label: "Offers' Price History",
      description:
        isLoading || !property
          ? "Loading offers history..."
          : property?.offers?.sale?.length + property?.offers?.rent?.length === 0
          ? "This property has no offers"
          : `View the price history of ${property?.offers?.sale?.length + property?.offers?.rent?.length} offers`,

      content: (
        <>
          {!isLoading && property ? (
            <>
              {property?.offers?.sale?.length > 0 && (
                <>
                  <Title order={4}>Sale offers:</Title>
                  <PropertyOfferHistoryChart
                    offers={property?.offers.sale}
                    extra={(property?.current_price_sale ?? 0) / 10}
                  />
                </>
              )}
              {property?.offers?.rent?.length > 0 && (
                <>
                  <Title className="pt-1" order={4}>
                    Rent offers:
                  </Title>
                  <PropertyOfferHistoryChart
                    offers={property?.offers.rent}
                    extra={(property?.current_price_rent ?? 0) / 10}
                  />
                </>
              )}
            </>
          ) : (
            <Skeleton height="100%" />
          )}
        </>
      ),
      disabled: isLoading || !property || property?.offers?.sale?.length + property?.offers?.rent?.length === 0,
    },
  ];

  const items = itemList.map((item) => (
    <Accordion.Item value={item.id} key={item.label}>
      <Accordion.Control disabled={item.disabled}>
        <AccordionLabel {...item} />
      </Accordion.Control>
      <Accordion.Panel>{item.content}</Accordion.Panel>
    </Accordion.Item>
  ));

  const deleteOffer = () => {
    if (selectedOffer && selectedOffer.id && property && property.offers) {
      makeRequest(`me/offers/${selectedOffer.id.toString()}`, "DELETE", session?.user.access_token)
        .then(() => {
          setSelectedOffer(null);
          setOfferRecords(offerRecords.filter((offer) => offer.id !== selectedOffer.id));
          close();

          if (selectedOffer.listing_type === "sale") {
            property.offers.sale = property.offers.sale.filter((offer) => offer.id !== selectedOffer.id);
          } else if (selectedOffer.listing_type === "rent") {
            property.offers.rent = property.offers.rent.filter((offer) => offer.id !== selectedOffer.id);
          }

          successNotification("This offer has been removed", "Offer removed");

          if (property?.offers?.sale?.length + property?.offers?.rent?.length === 0) {
            setAccordionValue(accordionValue.filter((value) => value !== "offers"));
          }
        })
        .catch(() => errorNotification("An unknown error occurred while removing this offer."));
    }
  };

  return (
    <>
      <ConfirmationModal
        opened={modalOpened}
        close={close}
        yesFunction={deleteOffer}
        title="Remove offer"
        text="Are you sure you want to remove this offer? This will also remove the full history for this offer."
        yesBtn={{ text: "Remove", color: "red", variant: "filled", icon: <IconTrash size="1rem" className="-mr-1" /> }}
        noBtn={{ text: "Cancel", variant: "default" }}
      />
      <Accordion
        defaultValue={property && propertyDetailsResume(property) ? ["details"] : []}
        chevronPosition="right"
        variant="contained"
        multiple
        value={accordionValue}
        onChange={setAccordionValue}
      >
        {items}
      </Accordion>
    </>
  );
}
