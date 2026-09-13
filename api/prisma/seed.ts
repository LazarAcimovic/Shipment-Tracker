/// <reference types="node" />
import { ShipmentStatus } from "@prisma/client";
import { prisma } from "../src/config/prisma";

const STATUS_ORDER: ShipmentStatus[] = [
  "CONFIRMED",
  "PREPARED",
  "PICKED_UP",
  "DEPARTED",
  "AT_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

function eventsForTarget(target: ShipmentStatus): ShipmentStatus[] {
  const idx = STATUS_ORDER.indexOf(target);
  return STATUS_ORDER.slice(0, idx + 1);
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function addDays(date: Date, days: number): Date {
  return addHours(date, days * 24);
}

const NOW = new Date();

async function truncate() {
  await prisma.shipmentEvent.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.customer.deleteMany();
}

async function main() {
  await truncate();
  await prisma.$transaction(async (tx) => {
    const customers = await Promise.all([
      tx.customer.create({
        data: {
          name: "Acme Corp",
          email: "logistics@acme.com",
          address: "123 Industrial Rd",
          city: "Frankfurt",
          country: "Germany",
        },
      }),
      tx.customer.create({
        data: {
          name: "Nordic Supplies AB",
          email: "orders@nordicsupplies.se",
          address: "45 Harbour St",
          city: "Stockholm",
          country: "Sweden",
        },
      }),
      tx.customer.create({
        data: {
          name: "Iberia Parts SL",
          email: "shipping@iberiaparts.es",
          address: "8 Calle Mayor",
          city: "Madrid",
          country: "Spain",
        },
      }),
      tx.customer.create({
        data: {
          name: "Alpine Goods GmbH",
          email: "supply@alpinegoods.at",
          address: "12 Bergstrasse",
          city: "Vienna",
          country: "Austria",
        },
      }),
      tx.customer.create({
        data: {
          name: "Coastal Trading Ltd",
          email: "ops@coastaltrading.co.uk",
          address: "7 Dock Lane",
          city: "Rotterdam",
          country: "Netherlands",
        },
      }),
    ]);

    const [acme, nordic, iberia, alpine, coastal] = customers;

    type ShipmentSpec = {
      customerId: string;
      origin: string;
      destination: string;
      targetStatus: ShipmentStatus;
      promisedDeliveryDate: Date;
      createdAt: Date;
    };

    const specs: ShipmentSpec[] = [
      {
        customerId: acme.id,
        origin: "Hamburg",
        destination: "Frankfurt",
        targetStatus: "CONFIRMED",
        promisedDeliveryDate: addDays(NOW, 9),
        createdAt: addDays(NOW, -1),
      },
      {
        customerId: nordic.id,
        origin: "Gothenburg",
        destination: "Stockholm",
        targetStatus: "PREPARED",
        promisedDeliveryDate: addDays(NOW, 8),
        createdAt: addDays(NOW, -2),
      },
      {
        customerId: iberia.id,
        origin: "Barcelona",
        destination: "Madrid",
        targetStatus: "PICKED_UP",
        promisedDeliveryDate: addDays(NOW, 7),
        createdAt: addDays(NOW, -3),
      },
      {
        customerId: alpine.id,
        origin: "Salzburg",
        destination: "Vienna",
        targetStatus: "DEPARTED",
        promisedDeliveryDate: addDays(NOW, 6),
        createdAt: addDays(NOW, -4),
      },
      {
        customerId: coastal.id,
        origin: "Amsterdam",
        destination: "Rotterdam",
        targetStatus: "AT_HUB",
        promisedDeliveryDate: addDays(NOW, 6),
        createdAt: addDays(NOW, -4),
      },
      {
        customerId: acme.id,
        origin: "Munich",
        destination: "Berlin",
        targetStatus: "OUT_FOR_DELIVERY",
        promisedDeliveryDate: addDays(NOW, 5),
        createdAt: addDays(NOW, -5),
      },
      {
        customerId: nordic.id,
        origin: "Oslo",
        destination: "Copenhagen",
        targetStatus: "DELIVERED",
        promisedDeliveryDate: addDays(NOW, 3),
        createdAt: addDays(NOW, -8),
      },
      {
        customerId: iberia.id,
        origin: "Lisbon",
        destination: "Porto",
        targetStatus: "DELIVERED",
        promisedDeliveryDate: addDays(NOW, 1),
        createdAt: addDays(NOW, -10),
      },
      // Late in-transit - promised date passed, not yet delivered
      {
        customerId: alpine.id,
        origin: "Graz",
        destination: "Innsbruck",
        targetStatus: "OUT_FOR_DELIVERY",
        promisedDeliveryDate: addDays(NOW, 2),
        createdAt: addDays(NOW, -7),
      },
      {
        customerId: coastal.id,
        origin: "Brussels",
        destination: "Antwerp",
        targetStatus: "AT_HUB",
        promisedDeliveryDate: addDays(NOW, 3),
        createdAt: addDays(NOW, -6),
      },
      {
        customerId: acme.id,
        origin: "Dortmund",
        destination: "Cologne",
        targetStatus: "DEPARTED",
        promisedDeliveryDate: addDays(NOW, 1),
        createdAt: addDays(NOW, -9),
      },
      {
        customerId: nordic.id,
        origin: "Helsinki",
        destination: "Tampere",
        targetStatus: "PICKED_UP",
        promisedDeliveryDate: addDays(NOW, 0),
        createdAt: addDays(NOW, -8),
      },
      {
        customerId: iberia.id,
        origin: "Seville",
        destination: "Valencia",
        targetStatus: "AT_HUB",
        promisedDeliveryDate: addDays(NOW, -1),
        createdAt: addDays(NOW, -10),
      },
      // Delivered late
      {
        customerId: alpine.id,
        origin: "Linz",
        destination: "Graz",
        targetStatus: "DELIVERED",
        promisedDeliveryDate: addDays(NOW, -2),
        createdAt: addDays(NOW, -12),
      },
      {
        customerId: coastal.id,
        origin: "The Hague",
        destination: "Utrecht",
        targetStatus: "DELIVERED",
        promisedDeliveryDate: addDays(NOW, 0),
        createdAt: addDays(NOW, -11),
      },
      // Delivered on time
      {
        customerId: acme.id,
        origin: "Berlin",
        destination: "Hamburg",
        targetStatus: "DELIVERED",
        promisedDeliveryDate: addDays(NOW, 7),
        createdAt: addDays(NOW, -5),
      },
      // More on-time variety
      {
        customerId: acme.id,
        origin: "Stuttgart",
        destination: "Nuremberg",
        targetStatus: "CONFIRMED",
        promisedDeliveryDate: addDays(NOW, 11),
        createdAt: addDays(NOW, -1),
      },
      {
        customerId: nordic.id,
        origin: "Malmo",
        destination: "Gothenburg",
        targetStatus: "PREPARED",
        promisedDeliveryDate: addDays(NOW, 10),
        createdAt: addDays(NOW, -2),
      },
      {
        customerId: coastal.id,
        origin: "Eindhoven",
        destination: "Amsterdam",
        targetStatus: "OUT_FOR_DELIVERY",
        promisedDeliveryDate: addDays(NOW, 5),
        createdAt: addDays(NOW, -6),
      },
    ];

    for (const spec of specs) {
      const chain = eventsForTarget(spec.targetStatus);
      const stepHours = 10;

      const eventTimes = chain.map((_, i) =>
        addHours(spec.createdAt, (i + 1) * stepHours),
      );

      let deliveredAt: Date | null = null;
      if (spec.targetStatus === "DELIVERED") {
        const naturalDelivery = eventTimes[eventTimes.length - 1];
        if (
          spec.promisedDeliveryDate < NOW &&
          naturalDelivery <= spec.promisedDeliveryDate
        ) {
          deliveredAt = addDays(spec.promisedDeliveryDate, 2);
          eventTimes[eventTimes.length - 1] = deliveredAt;
        } else {
          deliveredAt = naturalDelivery;
        }
      }

      const shipment = await tx.shipment.create({
        data: {
          customerId: spec.customerId,
          origin: spec.origin,
          destination: spec.destination,
          promisedDeliveryDate: spec.promisedDeliveryDate,
          currentStatus: spec.targetStatus,
          deliveredAt,
          createdAt: spec.createdAt,
        },
      });

      for (const [i, status] of chain.entries()) {
        await tx.shipmentEvent.create({
          data: {
            shipmentId: shipment.id,
            status,
            occurredAt: eventTimes[i],
            location:
              i === 0
                ? spec.origin
                : i === chain.length - 1
                  ? spec.destination
                  : `Hub ${i}`,
            note: i === 0 ? "Shipment confirmed and registered" : null,
          },
        });
      }
    }
  }, { timeout: 60000 });

  console.log("Seed complete: 5 customers, 18 shipments across all statuses.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
