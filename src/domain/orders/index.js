import React, { useState, useCallback, useEffect } from "react"
import { navigate } from "gatsby"
import _ from "lodash"
import { Router } from "@reach/router"
import { Text, Box, Flex } from "rebass"
import { Input } from "@rebass/forms"
import styled from "@emotion/styled"
import moment from "moment"
import qs from "query-string"
import ReactTooltip from "react-tooltip"

import Details from "./details"
import New from "./new"
import {
  Table,
  TableBody,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableDataCell,
  TableHeaderRow,
} from "../../components/table"
import Badge from "../../components/badge"

import useMedusa from "../../hooks/use-medusa"
import Spinner from "../../components/spinner"
import Button from "../../components/button"
import Filter from "./filter-dropdown"

const OrderNumCell = styled(Text)`
  color: #006fbb;
  z-index: 1000;

  &:hover {
    text-decoration: underline;
  }
`

const OrderIndex = ({}) => {
  const filtersOnLoad = qs.parse(window.location.search)

  if (!filtersOnLoad.offset) {
    filtersOnLoad.offset = 0
  }

  if (!filtersOnLoad.limit) {
    filtersOnLoad.limit = 50
  }

  const { orders, total_count, isLoading, refresh } = useMedusa("orders", {
    search: `?${qs.stringify(filtersOnLoad)}`,
  })

  const [query, setQuery] = useState("")
  const [limit, setLimit] = useState(50)
  const [offset, setOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState({ open: false, filter: "" })
  const [fulfillmentFilter, setFulfillmentFilter] = useState({
    open: false,
    filter: "",
  })
  const [paymentFilter, setPaymentFilter] = useState({
    open: false,
    filter: "",
  })

  const onKeyDown = event => {
    // 'keypress' event misbehaves on mobile so we track 'Enter' key via 'keydown' event
    if (event.key === "Enter") {
      event.preventDefault()
      event.stopPropagation()
      searchQuery()
    }
  }

  const searchQuery = () => {
    setOffset(0)
    const baseUrl = qs.parseUrl(window.location.href).url

    const prepared = qs.stringify(
      {
        q: query,
        payment_status: paymentFilter.filter || "",
        fulfillment_status: fulfillmentFilter.filter || "",
        status: statusFilter.filter || "",
        offset: 0,
        limit: 50,
      },
      { skipNull: true, skipEmptyString: true }
    )

    window.history.replaceState(baseUrl, "", `?${prepared}`)
    refresh({ search: `?${prepared}` })
  }

  const handlePagination = direction => {
    const updatedOffset = direction === "next" ? offset + limit : offset - limit
    const baseUrl = qs.parseUrl(window.location.href).url

    const prepared = qs.stringify(
      {
        q: query,
        payment_status: paymentFilter.filter || "",
        fulfillment_status: fulfillmentFilter.filter || "",
        status: statusFilter.filter || "",
        offset: updatedOffset,
        limit,
      },
      { skipNull: true, skipEmptyString: true }
    )

    window.history.replaceState(baseUrl, "", `?${prepared}`)

    refresh({ search: `?${prepared}` }).then(() => {
      setOffset(updatedOffset)
    })
  }

  const submit = () => {
    const baseUrl = qs.parseUrl(window.location.href).url

    const prepared = qs.stringify(
      {
        q: query,
        payment_status: paymentFilter.filter || "",
        fulfillment_status: fulfillmentFilter.filter || "",
        status: statusFilter.filter || "",
        offset,
        limit,
      },
      { skipNull: true, skipEmptyString: true }
    )

    window.history.replaceState(baseUrl, "", `?${prepared}`)
    refresh({ search: `?${prepared}` })
  }

  const clear = () => {
    const baseUrl = qs.parseUrl(window.location.href).url
    setQuery("")
    window.history.replaceState(baseUrl, "", `?limit=${limit}&offset=${offset}`)
    refresh()
  }

  const moreResults = orders && orders.length >= limit

  return (
    <Flex flexDirection="column" mb={5}>
      <Flex>
        <Text mb={3}>Orders</Text>
        <Box ml="auto" />
        <Button
          disabled={true}
          onClick={() => navigate(`/a/orders/new`)}
          variant={"cta"}
        >
          New draft order
        </Button>
      </Flex>
      <Flex>
        <Box ml="auto" />
        <Box mb={3} sx={{ maxWidth: "300px" }} mr={2}>
          <Input
            height="28px"
            fontSize="12px"
            id="email"
            name="q"
            type="text"
            placeholder="Search orders"
            onKeyDown={onKeyDown}
            onChange={e => setQuery(e.target.value)}
            value={query}
          />
        </Box>
        <Button
          onClick={() => searchQuery()}
          variant={"primary"}
          fontSize="12px"
          mr={2}
        >
          Search
        </Button>
        <Filter
          submitFilters={submit}
          clearFilters={clear}
          statusFilter={statusFilter}
          fulfillmentFilter={fulfillmentFilter}
          paymentFilter={paymentFilter}
          setStatusFilter={setStatusFilter}
          setPaymentFilter={setPaymentFilter}
          setFulfillmentFilter={setFulfillmentFilter}
        />
      </Flex>
      {isLoading ? (
        <Flex
          flexDirection="column"
          alignItems="center"
          height="100vh"
          mt="auto"
        >
          <Box height="75px" width="75px" mt="50%">
            <Spinner dark />
          </Box>
        </Flex>
      ) : (
        <Table>
          <TableHead>
            <TableHeaderRow>
              <TableHeaderCell>Order</TableHeaderCell>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Customer</TableHeaderCell>
              <TableHeaderCell>Fulfillment</TableHeaderCell>
              <TableHeaderCell>Payment status</TableHeaderCell>
              <TableHeaderCell>Payment provider</TableHeaderCell>
            </TableHeaderRow>
          </TableHead>
          <TableBody>
            {orders.map((el, i) => {
              const fulfillmentBgColor =
                el.fulfillment_status === "fulfilled" ? "#4BB543" : "#e3e8ee"
              const fulfillmentColor =
                el.fulfillment_status === "fulfilled" ? "white" : "#4f566b"

              const paymentBgColor =
                el.payment_status === "captured" ? "#4BB543" : "#e3e8ee"
              const paymentColor =
                el.payment_status === "captured" ? "white" : "#4f566b"

              return (
                <TableRow
                  key={i}
                  onClick={() => navigate(`/a/orders/${el._id}`)}
                >
                  <TableDataCell>
                    <OrderNumCell>#{el.display_id}</OrderNumCell>
                  </TableDataCell>
                  <TableDataCell
                    data-for={el._id}
                    data-tip={moment(el.created).format("MMMM Do YYYY HH:mm a")}
                  >
                    <ReactTooltip id={el._id} place="top" effect="solid" />
                    {moment(el.created).format("MMM Do YYYY")}
                  </TableDataCell>
                  <TableDataCell>{el.email}</TableDataCell>
                  <TableDataCell>
                    <Box>
                      <Badge color={fulfillmentColor} bg={fulfillmentBgColor}>
                        {el.fulfillment_status}
                      </Badge>
                    </Box>
                  </TableDataCell>
                  <TableDataCell>
                    <Box>
                      <Badge color={paymentColor} bg={paymentBgColor}>
                        {el.payment_status}
                      </Badge>
                    </Box>
                  </TableDataCell>
                  <TableDataCell>{el.payment_method.provider_id}</TableDataCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
      <Flex mt={2}>
        <Box ml="auto" />
        <Button
          onClick={() => handlePagination("previous")}
          disabled={offset === 0}
          variant={"primary"}
          fontSize="12px"
          height="24px"
          mr={1}
        >
          Previous
        </Button>
        <Button
          onClick={() => handlePagination("next")}
          disabled={!moreResults}
          variant={"primary"}
          fontSize="12px"
          height="24px"
          ml={1}
        >
          Next
        </Button>
      </Flex>
    </Flex>
  )
}

const Orders = () => {
  return (
    <Router>
      <OrderIndex path="/" />
      <Details path=":id" />
      <New path="/new" />
    </Router>
  )
}

export default Orders
