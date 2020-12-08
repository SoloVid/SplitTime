namespace splitTime.math {
    splitTime.test.scenario(math, "Polygon#findPointToward() with square", t => {
        const square = new Polygon([
            new Vector2D(1, 1),
            new Vector2D(1, 3),
            new Vector2D(3, 3),
            new Vector2D(3, 1)
        ])

        const leftPoint = square.findPointToward(Math.PI)
        t.assertEqual(1, leftPoint.x, "Left should be (1, 2)")
        t.assertEqual(2, leftPoint.y, "Left should be (1, 2)")

        const upLeftPoint = square.findPointToward(3 * Math.PI / 4)
        t.assertEqual(1, upLeftPoint.x, "Up-left should be (1, 3)")
        t.assertEqual(3, upLeftPoint.y, "Up-left should be (1, 3)")

        const upPoint = square.findPointToward(Math.PI / 2)
        t.assertEqual(2, upPoint.x, "Up should be (2, 3)")
        t.assertEqual(3, upPoint.y, "Up should be (2, 3)")

        const upRightPoint = square.findPointToward(Math.PI / 4)
        t.assertEqual(3, upRightPoint.x, "Up-right should be (3, 3)")
        t.assertEqual(3, upRightPoint.y, "Up-right should be (3, 3)")

        const rightPoint = square.findPointToward(0)
        t.assertEqual(3, rightPoint.x, "Up should be (3, 2)")
        t.assertEqual(2, rightPoint.y, "Up should be (3, 2)")

        const downRightPoint = square.findPointToward(-Math.PI / 4)
        t.assertEqual(3, downRightPoint.x, "Down-right should be (3, 1)")
        t.assertEqual(1, downRightPoint.y, "Down-right should be (3, 1)")

        const downPoint = square.findPointToward(-Math.PI / 2)
        t.assertEqual(2, downPoint.x, "Down should be (2, 1)")
        t.assertEqual(1, downPoint.y, "Down should be (2, 1)")

        const downLeftPoint = square.findPointToward(-3 * Math.PI / 4)
        t.assertEqual(1, downLeftPoint.x, "Down-left should be (1, 1)")
        t.assertEqual(1, downLeftPoint.y, "Down-left should be (1, 1)")
    })

    splitTime.test.scenario(math, "Polygon#findPointToward() with diamond", t => {
        const diamond = new Polygon([
            new Vector2D(1, 3),
            new Vector2D(3, 5),
            new Vector2D(5, 3),
            new Vector2D(3, 1)
        ])

        const leftPoint = diamond.findPointToward(Math.PI)
        t.assertEqual(1, leftPoint.x, "Left should be (1, 3)")
        t.assertEqual(3, leftPoint.y, "Left should be (1, 3)")

        const upLeftPoint = diamond.findPointToward(3 * Math.PI / 4)
        t.assertEqual(2, upLeftPoint.x, "Up-left should be (2, 4)")
        t.assertEqual(4, upLeftPoint.y, "Up-left should be (2, 4)")

        const upPoint = diamond.findPointToward(Math.PI / 2)
        t.assertEqual(3, upPoint.x, "Up should be (3, 5)")
        t.assertEqual(5, upPoint.y, "Up should be (3, 5)")

        const upRightPoint = diamond.findPointToward(Math.PI / 4)
        t.assertEqual(4, upRightPoint.x, "Up-right should be (4, 4)")
        t.assertEqual(4, upRightPoint.y, "Up-right should be (4, 4)")

        const rightPoint = diamond.findPointToward(0)
        t.assertEqual(5, rightPoint.x, "Up should be (5, 3)")
        t.assertEqual(3, rightPoint.y, "Up should be (5, 3)")

        const downRightPoint = diamond.findPointToward(-Math.PI / 4)
        t.assertEqual(4, downRightPoint.x, "Down-right should be (4, 2)")
        t.assertEqual(2, downRightPoint.y, "Down-right should be (4, 2)")

        const downPoint = diamond.findPointToward(-Math.PI / 2)
        t.assertEqual(3, downPoint.x, "Down should be (3, 1)")
        t.assertEqual(1, downPoint.y, "Down should be (3, 1)")

        const downLeftPoint = diamond.findPointToward(-3 * Math.PI / 4)
        t.assertEqual(2, downLeftPoint.x, "Down-left should be (2, 2)")
        t.assertEqual(2, downLeftPoint.y, "Down-left should be (2, 2)")
    })

    splitTime.test.scenario(math, "Polygon#findPointToward() with triangle", t => {
        const triangle = new Polygon([
            new Vector2D(1, 1),
            new Vector2D(3, 3),
            new Vector2D(5, 1)
        ])

        const leftPoint = triangle.findPointToward(Math.PI)
        t.assertEqual(1, leftPoint.x, "Left should be (1, 1)")
        t.assertEqual(1, leftPoint.y, "Left should be (1, 1)")

        const upLeftPoint = triangle.findPointToward(3 * Math.PI / 4)
        t.assertEqual(2, upLeftPoint.x, "Up-left should be (2, 2)")
        t.assertEqual(2, upLeftPoint.y, "Up-left should be (2, 2)")

        const upPoint = triangle.findPointToward(Math.PI / 2)
        t.assertEqual(3, upPoint.x, "Up should be (3, 3)")
        t.assertEqual(3, upPoint.y, "Up should be (3, 3)")

        const upRightPoint = triangle.findPointToward(Math.PI / 4)
        t.assertEqual(4, upRightPoint.x, "Up-right should be (4, 2)")
        t.assertEqual(2, upRightPoint.y, "Up-right should be (4, 2)")

        const rightPoint = triangle.findPointToward(0)
        t.assertEqual(5, rightPoint.x, "Up should be (5, 1)")
        t.assertEqual(1, rightPoint.y, "Up should be (5, 1)")

        const downRightPoint = triangle.findPointToward(-Math.PI / 4)
        t.assertEqual(5, downRightPoint.x, "Down-right should be (5, 1)")
        t.assertEqual(1, downRightPoint.y, "Down-right should be (5, 1)")

        const downPoint = triangle.findPointToward(-Math.PI / 2)
        t.assertEqual(3, downPoint.x, "Down should be (3, 1)")
        t.assertEqual(1, downPoint.y, "Down should be (3, 1)")

        const downLeftPoint = triangle.findPointToward(-3 * Math.PI / 4)
        t.assertEqual(1, downLeftPoint.x, "Down-left should be (1, 1)")
        t.assertEqual(1, downLeftPoint.y, "Down-left should be (1, 1)")
    })
}